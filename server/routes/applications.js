const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const { sendEmail } = require('../services/emailService');

// Apply for a job
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const { job_id, cover_letter } = req.body;
    const user_id = req.user.id;

    console.log('🔍 Application request:', { job_id, candidate_id: user_id, cover_letter });

    // Check if user already applied for this job
    const { data: existingApplication, error: checkError } = await supabaseAdmin
      .from('job_applications')
      .select('id')
      .eq('job_id', job_id)
      .eq('candidate_id', user_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking existing application:', checkError);
      throw checkError;
    }

    if (existingApplication) {
      console.log('⚠️ User already applied for this job');
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create new application in database
    const { data: newApplication, error: insertError } = await supabaseAdmin
      .from('job_applications')
      .insert([{
        job_id,
        candidate_id: user_id,
        cover_letter: cover_letter || '',
        status: 'pending'
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting application:', insertError);
      throw insertError;
    }

    console.log('✅ Application created successfully:', newApplication);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application: newApplication
    });

  } catch (error) {
    console.error('❌ Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
});

// Get applications for a candidate
router.get('/candidate/:candidate_id', authenticateToken, async (req, res) => {
  try {
    const { candidate_id } = req.params;
    const user_id = req.user.id;

    console.log('🔍 Fetching applications for candidate:', candidate_id);

    // Check if user is accessing their own applications
    if (candidate_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get applications from database
    const { data: candidateApplications, error } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        job:jobs(
          id,
          title,
          company:companies(name),
          location,
          salary_min,
          salary_max,
          employment_type
        )
      `)
      .eq('candidate_id', candidate_id)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching applications:', error);
      throw error;
    }

    console.log('✅ Found applications:', candidateApplications?.length || 0);

    res.json({
      success: true,
      applications: candidateApplications || []
    });

  } catch (error) {
    console.error('❌ Error fetching candidate applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
});

// Get applications for a job (for recruiters)
router.get('/job/:job_id', authenticateToken, async (req, res) => {
  try {
    const { job_id } = req.params;
    const user_id = req.user.id;

    console.log('🔍 Fetching applications for job:', job_id);

    // Check if user is a recruiter
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only recruiters can view job applications.'
      });
    }

    // Get applications from database with candidate details
    const { data: jobApplications, error } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        candidate:users!job_applications_candidate_id_fkey(
          id,
          name,
          email,
          phone,
          resume_url
        ),
        job:jobs(
          id,
          title,
          company:companies(name)
        )
      `)
      .eq('job_id', job_id)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching job applications:', error);
      throw error;
    }

    console.log('✅ Found job applications:', jobApplications?.length || 0);

    res.json({
      success: true,
      applications: jobApplications || []
    });

  } catch (error) {
    console.error('❌ Error fetching job applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
});

// Update application status (for recruiters)
router.put('/:application_id/status', authenticateToken, async (req, res) => {
  try {
    const { application_id } = req.params;
    const { status } = req.body;
    const user_id = req.user.id;

    // Check if user is a recruiter
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only recruiters can update application status.'
      });
    }

    // Update application status in database or delete if rejected
    let updatedApplication;
    
    if (status === 'rejected') {
      // For rejected applications, delete them from the database
      const { data: deletedApplication, error } = await supabaseAdmin
        .from('job_applications')
        .delete()
        .eq('id', application_id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error deleting rejected application:', error);
        throw error;
      }
      
      updatedApplication = deletedApplication;
      console.log('🗑️ Rejected application deleted from database');
    } else {
      // For accepted applications, update the status
      const { data: acceptedApplication, error } = await supabaseAdmin
        .from('job_applications')
        .update({ 
          status,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', application_id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating application status:', error);
        throw error;
      }
      
      updatedApplication = acceptedApplication;
    }

    if (!updatedApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get candidate and job details for email notification
    // For rejected applications, we need to get the details before deletion
    let applicationDetails;
    if (status === 'rejected') {
      // We already have the details from the deleted application
      applicationDetails = updatedApplication;
    } else {
      // For accepted applications, fetch fresh details
      const { data: details, error: detailsError } = await supabaseAdmin
        .from('job_applications')
        .select(`
          *,
          candidate:users!job_applications_candidate_id_fkey(
            name,
            email
          ),
          job:jobs(
            title,
            company:companies(name)
          )
        `)
        .eq('id', application_id)
        .single();
      
      if (detailsError) {
        console.error('❌ Error fetching application details for email:', detailsError);
        applicationDetails = null;
      } else {
        applicationDetails = details;
      }
    }

    if (applicationDetails) {
      // Send email notification to candidate
      try {
        const candidate = applicationDetails.candidate;
        const job = applicationDetails.job;
        const companyName = job.company?.name || 'Our Company';
        
        const emailSubject = `Application Update: ${status === 'accepted' ? 'Congratulations!' : 'Application Status Update'}`;
        
        let emailBody;
        if (status === 'accepted') {
          emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #059669;">🎉 Congratulations, ${candidate.name}!</h2>
              
              <p>We are pleased to inform you that your application for the position of <strong>${job.title}</strong> at <strong>${companyName}</strong> has been <strong style="color: #059669;">ACCEPTED</strong>!</p>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
                <h3 style="color: #059669; margin-top: 0;">What's Next?</h3>
                <ul style="color: #374151;">
                  <li>Our HR team will contact you within 2-3 business days</li>
                  <li>Be prepared to discuss your availability and start date</li>
                  <li>Have your documents ready for the onboarding process</li>
                </ul>
              </div>
              
              <p>We're excited to have you join our team! If you have any questions, please don't hesitate to reach out.</p>
              
              <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The ${companyName} Team</p>
            </div>
          `;
        } else {
          emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #374151;">Application Status Update</h2>
              
              <p>Dear ${candidate.name},</p>
              
              <p>Thank you for your interest in the <strong>${job.title}</strong> position at <strong>${companyName}</strong>. After careful consideration, we have decided not to move forward with your application at this time.</p>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <h3 style="color: #dc2626; margin-top: 0;">Keep in Touch</h3>
                <p style="color: #374151;">We encourage you to:</p>
                <ul style="color: #374151;">
                  <li>Apply for other positions that match your skills</li>
                  <li>Follow our company for future opportunities</li>
                  <li>Continue developing your professional skills</li>
                </ul>
              </div>
              
              <p>We appreciate the time and effort you put into your application and wish you the best in your career journey.</p>
              
              <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The ${companyName} Team</p>
            </div>
          `;
        }

        await sendEmail({
          to: candidate.email,
          subject: emailSubject,
          html: emailBody
        });

        console.log(`✅ Email notification sent to ${candidate.email} for ${status} application`);
      } catch (emailError) {
        console.error('❌ Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    const actionMessage = status === 'rejected' 
      ? 'Application rejected and removed from list. Candidate notified via email.'
      : 'Application accepted successfully and candidate notified via email';
    
    res.json({
      success: true,
      message: actionMessage,
      application: updatedApplication
    });

  } catch (error) {
    console.error('❌ Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status'
    });
  }
});

// Withdraw application (for candidates)
router.delete('/:application_id', authenticateToken, async (req, res) => {
  try {
    const { application_id } = req.params;
    const user_id = req.user.id;

    // Delete application from database
    const { data: deletedApplication, error } = await supabaseAdmin
      .from('job_applications')
      .delete()
      .eq('id', application_id)
      .eq('candidate_id', user_id) // Ensure user can only delete their own applications
      .select()
      .single();

    if (error) {
      console.error('❌ Error deleting application:', error);
      throw error;
    }

    if (!deletedApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error('❌ Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw application'
    });
  }
});

module.exports = router;
