const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Get all users (candidates or recruiters)
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data: users, error } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get all jobs
router.get('/jobs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        recruiter:users!jobs_recruiter_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Get all applications
router.get('/applications', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data: applications, error } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        job:jobs(title),
        candidate:users!job_applications_candidate_id_fkey(name, email)
      `)
      .order('applied_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Get dashboard stats with growth data
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [candidatesResult, recruitersResult, jobsResult, applicationsResult] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('role', 'candidate'),
      supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('role', 'recruiter'),
      supabaseAdmin.from('jobs').select('id', { count: 'exact' }),
      supabaseAdmin.from('job_applications').select('id', { count: 'exact' })
    ]);
    
    res.json({
      success: true,
      stats: {
        totalCandidates: candidatesResult.count || 0,
        totalRecruiters: recruitersResult.count || 0,
        totalJobs: jobsResult.count || 0,
        totalApplications: applicationsResult.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Get growth data for charts
router.get('/growth-data', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get last 6 months of data
    const { data: candidates, error: candidatesError } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .eq('role', 'candidate')
      .order('created_at', { ascending: true });

    const { data: recruiters, error: recruitersError } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .eq('role', 'recruiter')
      .order('created_at', { ascending: true });

    if (candidatesError || recruitersError) {
      throw candidatesError || recruitersError;
    }

    // Process data to get monthly counts
    const processMonthlyData = (data) => {
      const monthlyData = {};
      const months = [];
      
      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyData[monthKey] = 0;
        months.push(monthKey);
      }

      // Count entries per month
      data.forEach(item => {
        const date = new Date(item.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey]++;
        }
      });

      return { months, counts: months.map(m => monthlyData[m]) };
    };

    const candidatesData = processMonthlyData(candidates || []);
    const recruitersData = processMonthlyData(recruiters || []);

    res.json({
      success: true,
      candidatesGrowth: {
        labels: candidatesData.months,
        data: candidatesData.counts
      },
      recruitersGrowth: {
        labels: recruitersData.months,
        data: recruitersData.counts
      }
    });
  } catch (error) {
    console.error('Error fetching growth data:', error);
    res.status(500).json({ message: 'Failed to fetch growth data' });
  }
});

// Get recent items (top 3 candidates, recruiters, applications)
router.get('/recent-items', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [recentCandidates, recentRecruiters, recentApplications] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id, name, email, created_at, location')
        .eq('role', 'candidate')
        .order('created_at', { ascending: false })
        .limit(3),
      
      supabaseAdmin
        .from('users')
        .select('id, name, email, created_at, location')
        .eq('role', 'recruiter')
        .order('created_at', { ascending: false })
        .limit(3),
      
      supabaseAdmin
        .from('job_applications')
        .select(`
          id,
          applied_at,
          status,
          job:jobs(title),
          candidate:users!job_applications_candidate_id_fkey(name, email)
        `)
        .order('applied_at', { ascending: false })
        .limit(3)
    ]);

    res.json({
      success: true,
      recentCandidates: recentCandidates.data || [],
      recentRecruiters: recentRecruiters.data || [],
      recentApplications: recentApplications.data || []
    });
  } catch (error) {
    console.error('Error fetching recent items:', error);
    res.status(500).json({ message: 'Failed to fetch recent items' });
  }
});

// Create new user (candidate or recruiter)
router.post('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;
    
    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, password, and role are required' 
      });
    }
    
    if (!['candidate', 'recruiter'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Role must be either candidate or recruiter' 
      });
    }
    
    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        location: location || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Remove password from response
    delete newUser.password;
    
    res.json({
      success: true,
      message: `${role} created successfully`,
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create user' 
    });
  }
});

// Update user
router.put('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, location, password } = req.body;
    
    const updateData = { name, email, role, phone, location };
    
    // Hash password if provided
    if (password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Remove password from response
    delete updatedUser.password;
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update user' 
    });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete user' 
    });
  }
});

// Create new job
router.post('/jobs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      requirements, 
      location, 
      salary_min, 
      salary_max, 
      employment_type, 
      remote_work, 
      recruiter_id,
      skills_required,
      experience_required
    } = req.body;
    
    // Basic validation
    if (!title || !description || !requirements || !recruiter_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Title, description, requirements, and recruiter_id are required' 
      });
    }
    
    // Verify recruiter exists
    const { data: recruiter } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', recruiter_id)
      .eq('role', 'recruiter')
      .single();
    
    if (!recruiter) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid recruiter ID' 
      });
    }
    
    // Create job
    const { data: newJob, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        title,
        description,
        requirements,
        location: location || null,
        salary_min: salary_min ? parseInt(salary_min) : null,
        salary_max: salary_max ? parseInt(salary_max) : null,
        employment_type: employment_type || 'full-time',
        remote_work: remote_work || false,
        status: 'active',
        recruiter_id,
        skills_required: skills_required || [],
        experience_required: experience_required ? parseInt(experience_required) : 0
      })
      .select(`
        *,
        recruiter:users!jobs_recruiter_id_fkey(name, email)
      `)
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Job created successfully',
      job: newJob
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create job' 
    });
  }
});

// Update job
router.put('/jobs/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      requirements, 
      location, 
      salary_min, 
      salary_max, 
      employment_type, 
      remote_work, 
      status,
      skills_required,
      experience_required
    } = req.body;
    
    // Validate status if provided
    if (status && !['active', 'closed'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Status must be either active or closed' 
      });
    }
    
    const updateData = {
      title,
      description,
      requirements,
      location,
      salary_min: salary_min ? parseInt(salary_min) : null,
      salary_max: salary_max ? parseInt(salary_max) : null,
      employment_type,
      remote_work,
      status,
      skills_required,
      experience_required: experience_required ? parseInt(experience_required) : 0
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const { data: updatedJob, error } = await supabaseAdmin
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        recruiter:users!jobs_recruiter_id_fkey(name, email)
      `)
      .single();
    
    if (error) throw error;
    
    if (!updatedJob) {
      return res.status(404).json({ 
        success: false,
        message: 'Job not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update job' 
    });
  }
});

// Delete job
router.delete('/jobs/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete job' 
    });
  }
});

// Delete application
router.delete('/applications/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseAdmin
      .from('job_applications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete application' 
    });
  }
});

module.exports = router;

