const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const htmlPdf = require('html-pdf-node');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/resumes');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userID_timestamp_originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${req.user.id}_${uniqueSuffix}_${file.originalname}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
    }
  }
});

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Profile request received for user:', req.user.id);
    const userId = req.user.id;

    // Get basic user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ User query error:', userError);
      throw userError;
    }
    console.log('✅ User data retrieved:', user?.name);

    // Get user skills
    const { data: skills, error: skillsError } = await supabaseAdmin
      .from('user_skills')
      .select('skill_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (skillsError) {
      console.error('❌ Skills query error:', skillsError);
      throw skillsError;
    }
    console.log('✅ Skills data retrieved:', skills?.length || 0, 'skills');

    // Get user experiences
    const { data: experiencesRaw, error: experiencesError } = await supabaseAdmin
      .from('user_experiences')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (experiencesError) {
      console.error('❌ Experiences query error:', experiencesError);
      throw experiencesError;
    }
    
    // Transform experiences to match frontend format
    const experiences = experiencesRaw?.map(exp => ({
      id: exp.id,
      companyName: exp.company_name,
      jobRole: exp.job_role,
      yearsOfWork: exp.years_of_work,
      startDate: exp.start_date,
      endDate: exp.end_date,
      currentlyWorking: exp.currently_working
    })) || [];
    
    console.log('✅ Experiences data retrieved:', experiences?.length || 0, 'experiences');

    // Get user educations
    const { data: educationsRaw, error: educationsError } = await supabaseAdmin
      .from('user_educations')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (educationsError) {
      console.error('❌ Educations query error:', educationsError);
      throw educationsError;
    }
    
    // Transform educations to match frontend format
    const educations = educationsRaw?.map(edu => ({
      id: edu.id,
      degree: edu.degree,
      institution: edu.institution,
      fieldOfStudy: edu.field_of_study,
      startDate: edu.start_date,
      endDate: edu.end_date,
      currentlyStudying: edu.currently_studying,
      gpa: edu.gpa,
      description: edu.description
    })) || [];
    
    console.log('✅ Educations data retrieved:', educations?.length || 0, 'educations');

    let completionPercentage = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const personalInfoFields = [
      { field: 'name', weight: 8, label: 'Full Name' },
      { field: 'email', weight: 5, label: 'Email' },
      { field: 'phone', weight: 6, label: 'Phone Number' },
      { field: 'state', weight: 4, label: 'State' },
      { field: 'city', weight: 4, label: 'City' },
      { field: 'country', weight: 4, label: 'Country' },
      { field: 'bio', weight: 4, label: 'Bio/Summary' }
    ];

    personalInfoFields.forEach(({ field, weight }) => {
      totalPoints += weight;
      if (user[field] && user[field].toString().trim()) {
        earnedPoints += weight;
      }
    });

  
    totalPoints += 25;
    if (skills && skills.length > 0) {
      if (skills.length >= 5) {
        earnedPoints += 25; 
      } else if (skills.length >= 3) {
        earnedPoints += 20; 
      } else if (skills.length >= 1) {
        earnedPoints += 15; 
      }
    }

    
    totalPoints += 25;
    console.log('🎓 User is_fresher status:', user.is_fresher);
    if (user.is_fresher) {
    
      earnedPoints += 20;
      console.log('✅ Added 20 points for fresher status');
    } else if (experiences && experiences.length > 0) {
      if (experiences.length >= 3) {
        earnedPoints += 25;
      } else if (experiences.length >= 2) {
        earnedPoints += 20; 
      } else {
        earnedPoints += 15; 
      }
      console.log('✅ Added experience points for', experiences.length, 'experiences');
    } else {
      console.log('❌ No experience points added - not fresher and no experiences');
    }

    
    totalPoints += 15;
    if (educations && educations.length > 0) {
      if (educations.length >= 2) {
        earnedPoints += 15;
      } else {
        earnedPoints += 10;
      }
    }

    completionPercentage = Math.round((earnedPoints / totalPoints) * 100);
    
    /
    if (completionPercentage > 100) completionPercentage = 100;

    const personalInfoProgress = Math.round((personalInfoFields.reduce((acc, { field, weight }) => 
      acc + (user[field] && user[field].toString().trim() ? weight : 0), 0) / 35) * 100);
    
    const skillsProgress = skills && skills.length > 0 ? 
      Math.min(100, Math.round((skills.length / 5) * 100)) : 0;
    
    const experienceProgress = user.is_fresher ? 80 : 
      (experiences && experiences.length > 0 ? 
        Math.min(100, Math.round((experiences.length / 3) * 100)) : 0);
    
    console.log('📊 Experience progress calculation:');
    console.log('   - is_fresher:', user.is_fresher);
    console.log('   - experiences count:', experiences?.length || 0);
    console.log('   - calculated progress:', experienceProgress);
    
    const educationProgress = educations && educations.length > 0 ? 
      Math.min(100, Math.round((educations.length / 2) * 100)) : 0;

    res.json({
      success: true,
      data: {
        user,
        skills: skills.map(s => s.skill_name),
        experiences,
        educations,
        profileCompletion: completionPercentage,
        progressBreakdown: {
          personalInfo: personalInfoProgress,
          skills: skillsProgress,
          experience: experienceProgress,
          education: educationProgress,
          total: completionPercentage,
          earnedPoints,
          totalPoints
        }
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile data',
      error: error.message
    });
  }
});

// Update personal information
router.put('/personal-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, state, city, country, pinCode, bio } = req.body;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        email,
        phone,
        state,
        city,
        country,
        pin_code: pinCode,
        bio,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Personal information updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating personal info:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating personal information',
      error: error.message
    });
  }
});

// Update skills
router.put('/skills', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { skills } = req.body;

    // Delete existing skills
    const { error: deleteError } = await supabaseAdmin
      .from('user_skills')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Insert new skills
    if (skills && skills.length > 0) {
      const skillsData = skills.map(skill => ({
        user_id: userId,
        skill_name: skill
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_skills')
        .insert(skillsData);

      if (insertError) throw insertError;
    }

    res.json({
      success: true,
      message: 'Skills updated successfully'
    });
  } catch (error) {
    console.error('Error updating skills:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating skills',
      error: error.message
    });
  }
});

// Update experiences
router.put('/experiences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { experiences, isFresher } = req.body;

    console.log('🔍 Experience update request for user:', userId);
    console.log('📝 Received experiences data:', JSON.stringify(experiences, null, 2));
    console.log('🎓 Is fresher:', isFresher);
    console.log('🎓 Fresher type:', typeof isFresher);

    // Delete existing experiences
    const { error: deleteError } = await supabaseAdmin
      .from('user_experiences')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // If user is a fresher, don't insert any experiences but update user profile
    if (isFresher) {
      // Update user profile to mark as fresher
      const { error: updateUserError } = await supabaseAdmin
        .from('users')
        .update({ 
          is_fresher: true,
          experience_years: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateUserError) throw updateUserError;

      console.log('✅ User marked as fresher');
    } else {
      // Update user profile to unmark as fresher
      const { error: updateUserError } = await supabaseAdmin
        .from('users')
        .update({ 
          is_fresher: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateUserError) throw updateUserError;

      // Insert new experiences if provided
      if (experiences && experiences.length > 0) {
        const experiencesData = experiences.map(exp => {
          console.log('🔄 Mapping experience:', exp);
          
          const mappedExp = {
            user_id: userId,
            company_name: exp.companyName,
            job_role: exp.jobRole,
            years_of_work: exp.yearsOfWork,
            start_date: exp.startDate || null,
            end_date: exp.endDate || null,
            currently_working: exp.currentlyWorking || false
          };
          
          console.log('✅ Mapped experience data:', mappedExp);
          return mappedExp;
        });

        console.log('📤 Inserting experiences data:', JSON.stringify(experiencesData, null, 2));

        const { error: insertError } = await supabaseAdmin
          .from('user_experiences')
          .insert(experiencesData);

        if (insertError) throw insertError;
      }
    }

    res.json({
      success: true,
      message: isFresher ? 'Profile updated as fresher successfully' : 'Experiences updated successfully'
    });
  } catch (error) {
    console.error('Error updating experiences:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating experiences',
      error: error.message
    });
  }
});

// Update educations
router.put('/educations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { educations } = req.body;

    // Delete existing educations
    const { error: deleteError } = await supabaseAdmin
      .from('user_educations')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Insert new educations
    if (educations && educations.length > 0) {
      const educationsData = educations.map(edu => ({
        user_id: userId,
        degree: edu.degree,
        institution: edu.institution,
        field_of_study: edu.fieldOfStudy,
        start_date: edu.startDate || null,
        end_date: edu.endDate || null,
        currently_studying: edu.currentlyStudying || false,
        gpa: edu.gpa,
        description: edu.description
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_educations')
        .insert(educationsData);

      if (insertError) throw insertError;
    }

    res.json({
      success: true,
      message: 'Educations updated successfully'
    });
  } catch (error) {
    console.error('Error updating educations:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating educations',
      error: error.message
    });
  }
});

// Upload resume
router.post('/resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    // Update user's resume URL in database
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        resume_url: resumeUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resumeUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    
    // Delete uploaded file if database update fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading resume',
      error: error.message
    });
  }
});

// Delete resume
router.delete('/resume', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current resume URL
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('resume_url')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Delete file from filesystem
    if (user.resume_url) {
      const filePath = path.join(__dirname, '../uploads/resumes', path.basename(user.resume_url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update database
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        resume_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting resume',
      error: error.message
    });
  }
});

// Generate resume from profile data
router.post('/generate-resume', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all profile data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const { data: skills, error: skillsError } = await supabaseAdmin
      .from('user_skills')
      .select('skill_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (skillsError) throw skillsError;

    const { data: experiences, error: experiencesError } = await supabaseAdmin
      .from('user_experiences')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (experiencesError) throw experiencesError;

    const { data: educations, error: educationsError } = await supabaseAdmin
      .from('user_educations')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (educationsError) throw educationsError;

    // Generate HTML resume
    const resumeHtml = generateResumeHTML(user, skills, experiences, educations);
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads/resumes');
    console.log('📁 Uploads directory path:', uploadsDir);
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('📁 Creating uploads directory...');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Generate PDF from HTML
    const resumeFilename = `generated_resume_${userId}_${Date.now()}.pdf`;
    const resumePath = path.join(uploadsDir, resumeFilename);
    console.log('💾 Generating PDF resume to:', resumePath);
    
    try {
      const options = {
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        displayHeaderFooter: false
      };
      
      const file = { content: resumeHtml };
      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      
      fs.writeFileSync(resumePath, pdfBuffer);
      console.log('✅ PDF resume generated successfully');
    } catch (pdfError) {
      console.error('❌ Error generating PDF:', pdfError);
      throw new Error(`Failed to generate PDF resume: ${pdfError.message}`);
    }
    
    // Update user's resume_url
    const resumeUrl = `/uploads/resumes/${resumeFilename}`;
    await supabaseAdmin
      .from('users')
      .update({ resume_url: resumeUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    res.json({
      success: true,
      message: 'PDF resume generated successfully',
      resumeUrl
    });

  } catch (error) {
    console.error('Error generating resume:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate resume',
      error: error.message
    });
  }
});

// View generated resume
router.get('/view-resume', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('resume_url')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    if (!user.resume_url) {
      return res.status(404).json({
        success: false,
        message: 'No resume found. Please generate a resume first.'
      });
    }

    const filePath = path.join(__dirname, '../uploads/resumes', path.basename(user.resume_url));
    
    if (fs.existsSync(filePath)) {
      // Set appropriate headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(user.resume_url)}"`);
      res.sendFile(filePath);
    } else {
      res.status(404).json({ success: false, message: 'Resume file not found' });
    }

  } catch (error) {
    console.error('Error viewing resume:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to view resume',
      error: error.message
    });
  }
});

// Serve resume files directly
router.get('/uploads/resumes/:filename', authenticateToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    const userId = req.user.id;

    // Verify the user owns this resume or is a recruiter
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('resume_url, role')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const filePath = path.join(__dirname, '../uploads/resumes', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Resume file not found' });
    }

    // Check if user owns this resume or is a recruiter
    const userOwnsFile = user.resume_url && user.resume_url.includes(filename);
    const isRecruiter = user.role === 'recruiter';

    if (!userOwnsFile && !isRecruiter) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(filePath);

  } catch (error) {
    console.error('Error serving resume file:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to serve resume file',
      error: error.message
    });
  }
});

// Get any user's resume (for recruiters to download candidate resumes)
router.get('/resume/:candidateId', authenticateToken, async (req, res) => {
  try {
    const candidateId = req.params.candidateId;
    
    // Check if the requesting user is a recruiter
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only recruiters can download candidate resumes.'
      });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('resume_url, name')
      .eq('id', candidateId)
      .single();

    if (userError) throw userError;

    if (!user.resume_url) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this candidate.'
      });
    }

    const filePath = path.join(__dirname, '../uploads/resumes', path.basename(user.resume_url));
    
    if (fs.existsSync(filePath)) {
      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${user.name.replace(/\s+/g, '_')}_Resume.pdf"`);
      res.sendFile(filePath);
    } else {
      res.status(404).json({ success: false, message: 'Resume file not found' });
    }

  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ success: false, message: 'Failed to download resume' });
  }
});

// Get candidate's resume URL (for recruiters to view candidate resumes)
router.get('/resume-url/:candidateId', authenticateToken, async (req, res) => {
  try {
    const candidateId = req.params.candidateId;
    
    // Check if the requesting user is a recruiter
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only recruiters can view candidate resumes.'
      });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('name, resume_url')
      .eq('id', candidateId)
      .single();

    if (userError) throw userError;

    if (!user.resume_url) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this candidate'
      });
    }

    res.json({
      success: true,
      resumeUrl: user.resume_url,
      candidateName: user.name
    });

  } catch (error) {
    console.error('Error getting resume URL:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get resume URL' 
    });
  }
});

// Update skills via email (for AMP email form submissions)
// Handle checkbox-based skill updates from AMP email
router.post('/update-skills-checkboxes', async (req, res) => {
  try {
    const { candidate_id, job_id } = req.body;
    const selectedSkills = req.body['skills[]']; // Checkbox array from AMP form

    console.log('📧 Checkbox skill update from email:', { candidate_id, selectedSkills, job_id });

    if (!candidate_id) {
      return res.status(400).json({
        success: false,
        message: 'Candidate ID is required'
      });
    }

    if (!selectedSkills || (Array.isArray(selectedSkills) && selectedSkills.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one skill'
      });
    }

    // Ensure selectedSkills is an array
    const skillsArray = Array.isArray(selectedSkills) ? selectedSkills : [selectedSkills];

    // Get existing skills
    const { data: existingSkills, error: fetchError } = await supabaseAdmin
      .from('user_skills')
      .select('*')
      .eq('user_id', candidate_id);

    if (fetchError) {
      console.error('Error fetching existing skills:', fetchError);
    }

    const existingSkillNames = existingSkills ? existingSkills.map(s => s.skill_name.toLowerCase()) : [];

    // Add only new skills
    const newSkills = skillsArray.filter(skill => !existingSkillNames.includes(skill.toLowerCase()));

    if (newSkills.length > 0) {
      const skillRecords = newSkills.map(skill => ({
        user_id: candidate_id,
        skill_name: skill
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_skills')
        .insert(skillRecords);

      if (insertError) throw insertError;

      return res.json({
        success: true,
        message: `Successfully added ${newSkills.length} new skill(s) to your profile!`,
        addedSkills: newSkills
      });
    } else {
      return res.json({
        success: true,
        message: 'All selected skills are already in your profile!',
        addedSkills: []
      });
    }
  } catch (error) {
    console.error('Error updating skills from checkboxes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update skills',
      error: error.message
    });
  }
});

// Handle text input skill updates from email (legacy/fallback)
router.post('/update-skills-email', async (req, res) => {
  try {
    const { candidate_id, skills, job_id } = req.body;

    console.log('📧 Skill update from email:', { candidate_id, skills, job_id });

    if (!candidate_id || !skills) {
      return res.status(400).json({
        success: false,
        message: 'Candidate ID and skills are required'
      });
    }

    // Parse skills (comma-separated string to array)
    const skillsArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);

    if (skillsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one skill'
      });
    }

    // Get existing skills
    const { data: existingSkills, error: fetchError } = await supabaseAdmin
      .from('user_skills')
      .select('*')
      .eq('user_id', candidate_id);

    if (fetchError) {
      console.error('Error fetching existing skills:', fetchError);
    }

    const existingSkillNames = existingSkills ? existingSkills.map(s => s.skill_name.toLowerCase()) : [];

    // Add only new skills
    const newSkills = skillsArray.filter(skill => !existingSkillNames.includes(skill.toLowerCase()));

    if (newSkills.length > 0) {
      const skillRecords = newSkills.map(skill => ({
        user_id: candidate_id,
        skill_name: skill
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_skills')
        .insert(skillRecords);

      if (insertError) throw insertError;

      console.log(`✅ Added ${newSkills.length} new skills for candidate ${candidate_id}`);
    }

    // Return success response for AMP email
    res.status(200).json({
      success: true,
      message: `Successfully added ${newSkills.length} new skill(s)!`,
      skills_added: newSkills.length
    });

  } catch (error) {
    console.error('Error updating skills from email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update skills',
      error: error.message
    });
  }
});

// Serve uploaded files
router.get('/uploads/resumes/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/resumes', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file',
      error: error.message
    });
  }
});

// Helper function to generate HTML resume
function generateResumeHTML(user, skills, experiences, educations) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${user.name}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: #ffffff;
            max-width: 850px;
            margin: 0 auto;
            padding: 30px;
        }
        
        .header {
            background: linear-gradient(135deg, #fbbf24 0%, #1f2937 100%);
            color: white;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(251, 191, 36, 0.3);
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 15px;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .contact-info {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 20px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.2);
            padding: 8px 15px;
            border-radius: 25px;
            backdrop-filter: blur(10px);
        }
        
        .contact-item i {
            font-size: 1.1em;
        }
        
        .section {
            margin-bottom: 35px;
            background: #ffffff;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            border-left: 4px solid #fbbf24;
        }
        
        .section h2 {
            color: #2d3748;
            font-size: 1.6em;
            margin-bottom: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section h2 i {
            color: #fbbf24;
            font-size: 1.2em;
        }
        
        .bio {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            padding: 25px;
            border-radius: 10px;
            border-left: 4px solid #fbbf24;
            font-size: 1.1em;
            line-height: 1.7;
            color: #4a5568;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .skills-container {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        .skill-tag {
            background: linear-gradient(135deg, #fbbf24 0%, #1f2937 100%);
            color: white;
            padding: 10px 18px;
            border-radius: 25px;
            font-size: 0.95em;
            font-weight: 500;
            box-shadow: 0 3px 10px rgba(251, 191, 36, 0.3);
            transition: transform 0.2s ease;
        }
        
        .skill-tag:hover {
            transform: translateY(-2px);
        }
        
        .experience-item, .education-item {
            margin-bottom: 25px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .experience-item:hover, .education-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .item-title {
            font-weight: 600;
            color: #2d3748;
            font-size: 1.2em;
            margin-bottom: 5px;
        }
        
        .item-company {
            color: #fbbf24;
            font-weight: 500;
            font-size: 1.1em;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .item-company i {
            font-size: 0.9em;
        }
        
        .item-date {
            color: #718096;
            font-size: 0.95em;
            background: #f7fafc;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 500;
        }
        
        .item-details {
            color: #4a5568;
            margin-top: 10px;
            font-size: 0.95em;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 500;
            margin-top: 8px;
        }
        
        .current {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 20px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 10px;
            color: #718096;
            font-size: 0.9em;
        }
        
        .divider {
            height: 2px;
            background: linear-gradient(90deg, #fbbf24 0%, #1f2937 100%);
            border-radius: 2px;
            margin: 20px 0;
        }
        
        @media print {
            body {
                max-width: none;
                margin: 0;
                padding: 20px;
            }
            
            .section {
                page-break-inside: avoid;
                box-shadow: none;
                border: 1px solid #e2e8f0;
            }
            
            .header {
                box-shadow: none;
            }
        }
        
        @media (max-width: 768px) {
            body {
                padding: 15px;
            }
            
            .header h1 {
                font-size: 2.2em;
            }
            
            .contact-info {
                flex-direction: column;
                align-items: center;
            }
            
            .item-header {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${user.name || 'Your Name'}</h1>
        <div class="contact-info">
            ${user.email ? `<div class="contact-item"><i class="fas fa-envelope"></i> ${user.email}</div>` : ''}
            ${user.phone ? `<div class="contact-item"><i class="fas fa-phone"></i> ${user.phone}</div>` : ''}
            ${user.city && user.state ? `<div class="contact-item"><i class="fas fa-map-marker-alt"></i> ${user.city}, ${user.state}` : ''}
            ${user.country ? `, ${user.country}` : ''}${user.city && user.state ? '</div>' : ''}
            ${user.pin_code ? `<div class="contact-item"><i class="fas fa-home"></i> ${user.pin_code}</div>` : ''}
        </div>
    </div>

    ${user.bio && user.bio.trim() && !user.bio.includes('testing') ? `
    <div class="section">
        <h2><i class="fas fa-user-tie"></i> Professional Summary</h2>
        <div class="bio">${user.bio}</div>
    </div>
    ` : ''}

    ${skills && skills.length > 0 ? `
    <div class="section">
        <h2><i class="fas fa-tools"></i> Technical Skills</h2>
        <div class="skills-container">
            ${skills.map(skill => `<span class="skill-tag">${skill.skill_name}</span>`).join('')}
        </div>
    </div>
    ` : ''}

    ${experiences && experiences.length > 0 ? `
    <div class="section">
        <h2><i class="fas fa-briefcase"></i> Work Experience</h2>
        ${experiences.map(exp => `
            <div class="experience-item">
                <div class="item-header">
                    <div>
                        <div class="item-title">${exp.job_role}</div>
                        <div class="item-company"><i class="fas fa-building"></i> ${exp.company_name}</div>
                    </div>
                    <div class="item-date">
                        <i class="fas fa-calendar-alt"></i> ${exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - 
                        ${exp.currently_working ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '')}
                    </div>
                </div>
                ${exp.years_of_work ? `<div class="item-details"><i class="fas fa-clock"></i> Duration: ${exp.years_of_work}</div>` : ''}
                ${exp.currently_working ? '<span class="status-badge current"><i class="fas fa-check-circle"></i> Currently Working</span>' : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${educations && educations.length > 0 ? `
    <div class="section">
        <h2><i class="fas fa-graduation-cap"></i> Education</h2>
        ${educations.map(edu => `
            <div class="education-item">
                <div class="item-header">
                    <div>
                        <div class="item-title">${edu.degree}</div>
                        <div class="item-company"><i class="fas fa-university"></i> ${edu.institution}</div>
                        ${edu.field_of_study ? `<div class="item-details"><i class="fas fa-book"></i> ${edu.field_of_study}</div>` : ''}
                    </div>
                    <div class="item-date">
                        <i class="fas fa-calendar-alt"></i> ${edu.start_date ? new Date(edu.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - 
                        ${edu.currently_studying ? 'Present' : (edu.end_date ? new Date(edu.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '')}
                    </div>
                </div>
                ${edu.gpa ? `<div class="item-details"><i class="fas fa-star"></i> GPA: ${edu.gpa}</div>` : ''}
                ${edu.description ? `<div class="item-details"><i class="fas fa-info-circle"></i> ${edu.description}</div>` : ''}
                ${edu.currently_studying ? '<span class="status-badge current"><i class="fas fa-graduation-cap"></i> Currently Studying</span>' : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="footer">
        <p><i class="fas fa-calendar"></i> Generated on ${currentDate} via <strong>Hirefy Resume Builder</strong></p>
    </div>
</body>
</html>
  `;
}

module.exports = router;
