const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { sendNewJobNotifications } = require('../services/emailService');

const router = express.Router();

// Get company profile by user ID
router.get('/company-profile/:userId', async (req, res) => {
  try {
    const { data: companyProfile, error } = await supabaseAdmin
      .from('company_profiles')
      .select('company_name, company_logo_url')
      .eq('user_id', req.params.userId)
      .single();

    if (error) {
      console.error('Company profile error:', error);
      return res.json({ success: false, company_profile: null });
    }

    res.json({
      success: true,
      company_profile: companyProfile
    });
  } catch (error) {
    console.error('Get company profile error:', error);
    res.json({ success: false, company_profile: null });
  }
});

// Get all jobs (public endpoint)
router.get('/', async (req, res) => {
  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        recruiter:users(name, email),
        company:companies(name, logo_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to fetch jobs' });
    }

    res.json({
      success: true,
      jobs: jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test email endpoint - sends AMP email to ALL CANDIDATES (MUST BE BEFORE /:id routes)
router.post('/test-email', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.body;
    
    console.log('🔍 Test Email Request:', { jobId, userId: req.user.id });
    
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Get job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('❌ Job not found:', jobError);
      return res.status(404).json({ message: 'Job not found' });
    }

    console.log('✅ Job found:', job.title);

    // Check SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ SMTP not configured');
      return res.status(500).json({ message: 'SMTP not configured. Please check .env file' });
    }

    console.log('✅ SMTP configured:', process.env.SMTP_USER);

    // Fetch ALL candidates from the database
    const { data: candidates, error: candidatesError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('role', 'candidate');

    if (candidatesError) {
      console.error('❌ Failed to fetch candidates:', candidatesError);
      return res.status(500).json({ message: 'Failed to fetch candidates' });
    }

    if (!candidates || candidates.length === 0) {
      console.log('⚠️ No candidates found in the system');
      return res.status(404).json({ message: 'No candidates found in the system' });
    }

    console.log(`✅ Found ${candidates.length} candidates`);

    // Send emails to all candidates
    const { generateAMPEmailTemplate, generateFallbackEmailTemplate, createTransporter } = require('../services/emailService');
    
    const transporter = createTransporter();
    const emailPromises = [];
    let successCount = 0;
    let failCount = 0;

    for (const candidate of candidates) {
      try {
        console.log(`📧 Sending to: ${candidate.email}`);
        
        const ampTemplate = generateAMPEmailTemplate(candidate, job, job.recruiter_id);
        const fallbackTemplate = generateFallbackEmailTemplate(candidate, job);
        const isGmail = candidate.email.toLowerCase().includes('@gmail.com');

        const mailOptions = {
          from: process.env.SMTP_USER,
          to: candidate.email,
          subject: `🎯 Test Email: New Job Opportunity - ${job.title}`,
          html: fallbackTemplate,
          ...(isGmail && { amp: ampTemplate })
        };

        await transporter.sendMail(mailOptions);
        successCount++;
        console.log(`✅ Email sent to ${candidate.email}`);
      } catch (emailError) {
        failCount++;
        console.error(`❌ Failed to send to ${candidate.email}:`, emailError.message);
      }
    }

    console.log(`📊 Email Summary: ${successCount} sent, ${failCount} failed out of ${candidates.length} total`);

    res.json({ 
      message: `Test emails sent to ${successCount} candidates!`,
      totalCandidates: candidates.length,
      successCount,
      failCount,
      candidateEmails: candidates.map(c => c.email)
    });

  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({ 
      message: 'Failed to send test emails',
      error: error.message,
      details: error.toString()
    });
  }
});

// Get job by ID (public endpoint)
router.get('/:id', async (req, res) => {
  try {
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        recruiter:users(name, email)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new job (recruiter only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Recruiter role required.' });
    }

    const jobData = {
      ...req.body,
      recruiter_id: req.user.id.toString()
    };

    const { data: newJob, error } = await supabaseAdmin
      .from('jobs')
      .insert([jobData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to create job' });
    }

    // Check if auto-mails is enabled for this recruiter
    const { data: companyProfile } = await supabaseAdmin
      .from('company_profiles')
      .select('auto_mails_enabled')
      .eq('user_id', req.user.id)
      .single();

    // If auto-mails is enabled, send notifications to all candidates
    if (companyProfile?.auto_mails_enabled) {
      console.log('🚀 Auto-mails enabled, sending job notifications...');
      
      // Send emails asynchronously (don't wait for completion)
      sendNewJobNotifications(newJob, req.user.id)
        .then(result => {
          console.log('📧 Email notification result:', result);
        })
        .catch(err => {
          console.error('❌ Email notification error:', err);
        });
    } else {
      console.log('📭 Auto-mails disabled, skipping email notifications');
    }

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job: newJob,
      emails_sent: companyProfile?.auto_mails_enabled || false
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get jobs by recruiter ID
router.get('/recruiter/:recruiterId', authenticateToken, async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    console.log('Auth check:', {
      userRole: req.user.role,
      userId: req.user.id,
      recruiterId: recruiterId,
      isAdmin: req.user.role === 'admin',
      isOwner: req.user.id.toString() === recruiterId
    });
    
    // Verify the user is the recruiter or admin
    if (req.user.role !== 'admin' && req.user.id.toString() !== recruiterId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        recruiter:users(name, email)
      `)
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recruiter jobs:', error);
      return res.status(500).json({ message: 'Failed to fetch jobs' });
    }

    res.json(jobs);
  } catch (error) {
    console.error('Recruiter jobs fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a job (recruiter only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, check if the job exists and user has permission
    const { data: existingJob, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('recruiter_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && existingJob.recruiter_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data: updatedJob, error } = await supabaseAdmin
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      return res.status(500).json({ message: 'Failed to update job' });
    }

    res.json({ 
      message: 'Job updated successfully',
      job: updatedJob 
    });
  } catch (error) {
    console.error('Job update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a job (recruiter only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // First, check if the job exists and user has permission
    const { data: existingJob, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('recruiter_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && existingJob.recruiter_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting job:', error);
      return res.status(500).json({ message: 'Failed to delete job' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Job deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply for job (candidate only)
router.post('/:id/apply', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    // Check if already applied
    const { data: existingApplication } = await supabaseAdmin
      .from('job_applications')
      .select('id')
      .eq('job_id', req.params.id)
      .eq('candidate_id', req.user.id)
      .single();

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const applicationData = {
      job_id: req.params.id,
      candidate_id: req.user.id,
      cover_letter: req.body.cover_letter || '',
      resume_url: req.body.resume_url || ''
    };

    const { data: newApplication, error } = await supabaseAdmin
      .from('job_applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to submit application' });
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application: newApplication
    });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
