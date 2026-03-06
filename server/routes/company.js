const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for company logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/company-logos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'company-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for company logos'));
    }
  }
});

// Get company profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get company profile
    const { data: company, error: companyError } = await supabaseAdmin
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (companyError && companyError.code !== 'PGRST116') {
      throw companyError;
    }

    if (!company) {
      return res.json({
        success: true,
        data: null,
        message: 'No company profile found'
      });
    }

    // Get offices
    const { data: offices, error: officesError } = await supabaseAdmin
      .from('company_offices')
      .select('*')
      .eq('company_id', company.id)
      .order('is_headquarters', { ascending: false });

    if (officesError) throw officesError;

    // Get gallery images
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('company_gallery')
      .select('*')
      .eq('company_id', company.id)
      .order('order_index', { ascending: true });

    if (galleryError) throw galleryError;

    res.json({
      success: true,
      data: {
        company,
        offices: offices || [],
        gallery: gallery || []
      }
    });

  } catch (error) {
    console.error('Error fetching company profile:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company profile',
      error: error.message,
      details: error.code || 'Unknown error'
    });
  }
});

// Create or update company profile
router.post('/profile', authenticateToken, upload.single('company_logo'), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      company_name,
      industry,
      company_size,
      founded_year,
      website,
      description,
      mission_statement,
      company_values,
      headquarters_address,
      headquarters_city,
      headquarters_state,
      headquarters_country,
      headquarters_pin_code,
      contact_email,
      contact_phone,
      linkedin_url,
      twitter_url,
      facebook_url,
      instagram_url,
      benefits,
      perks,
      work_culture,
      remote_work_policy,
      diversity_inclusion
    } = req.body;

    // Handle company logo upload
    let company_logo_url = null;
    if (req.file) {
      company_logo_url = `/uploads/company-logos/${req.file.filename}`;
    }

    // Parse arrays from JSON strings with null safety
    const parsedCompanyValues = company_values && company_values.trim() ? JSON.parse(company_values) : [];
    const parsedBenefits = benefits && benefits.trim() ? JSON.parse(benefits) : [];
    const parsedPerks = perks && perks.trim() ? JSON.parse(perks) : [];

    const companyData = {
      user_id: userId,
      company_name: company_name || '',
      company_logo_url,
      industry: industry || '',
      company_size: company_size || '',
      founded_year: founded_year ? parseInt(founded_year) : null,
      website: website || '',
      description: description || '',
      mission_statement: mission_statement || '',
      company_values: parsedCompanyValues,
      headquarters_address: headquarters_address || '',
      headquarters_city: headquarters_city || '',
      headquarters_state: headquarters_state || '',
      headquarters_country: headquarters_country || '',
      headquarters_pin_code: headquarters_pin_code || '',
      contact_email: contact_email || '',
      contact_phone: contact_phone || '',
      linkedin_url: linkedin_url || '',
      twitter_url: twitter_url || '',
      facebook_url: facebook_url || '',
      instagram_url: instagram_url || '',
      benefits: parsedBenefits,
      perks: parsedPerks,
      work_culture: work_culture || '',
      remote_work_policy: remote_work_policy || '',
      diversity_inclusion: diversity_inclusion || '',
      updated_at: new Date().toISOString()
    };

    // Check if company profile exists
    const { data: existingCompany, error: checkError } = await supabaseAdmin
      .from('company_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existingCompany) {
      // Update existing profile
      const { data, error } = await supabaseAdmin
        .from('company_profiles')
        .update(companyData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabaseAdmin
        .from('company_profiles')
        .insert(companyData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({
      success: true,
      message: existingCompany ? 'Company profile updated successfully' : 'Company profile created successfully',
      data: result
    });

  } catch (error) {
    console.error('Error saving company profile:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({
      success: false,
      message: 'Failed to save company profile',
      error: error.message,
      details: error.code || 'Unknown error'
    });
  }
});


// Update offices
router.post('/offices', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { offices } = req.body;

    // Get company ID
    const { data: company, error: companyError } = await supabaseAdmin
      .from('company_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (companyError) throw companyError;
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    // Delete existing offices
    await supabaseAdmin
      .from('company_offices')
      .delete()
      .eq('company_id', company.id);

    // Insert new offices
    if (offices && offices.length > 0) {
      const officesData = offices.map(office => ({
        company_id: company.id,
        office_name: office.office_name,
        address: office.address,
        city: office.city,
        state: office.state,
        country: office.country,
        pin_code: office.pin_code,
        phone: office.phone,
        email: office.email,
        is_headquarters: office.is_headquarters || false,
        office_type: office.office_type
      }));

      const { error: insertError } = await supabaseAdmin
        .from('company_offices')
        .insert(officesData);

      if (insertError) throw insertError;
    }

    res.json({
      success: true,
      message: 'Offices updated successfully'
    });

  } catch (error) {
    console.error('Error updating offices:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update offices',
      error: error.message
    });
  }
});


// Upload gallery images
router.post('/gallery', authenticateToken, upload.array('gallery_images', 10), async (req, res) => {
  try {
    const userId = req.user.id;
    const { captions, types } = req.body;

    // Get company ID
    const { data: company, error: companyError } = await supabaseAdmin
      .from('company_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (companyError) throw companyError;
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const galleryData = req.files.map((file, index) => ({
      company_id: company.id,
      image_url: `/uploads/company-logos/${file.filename}`,
      image_caption: captions ? JSON.parse(captions)[index] : null,
      image_type: types ? JSON.parse(types)[index] : 'other',
      order_index: index
    }));

    const { error: insertError } = await supabaseAdmin
      .from('company_gallery')
      .insert(galleryData);

    if (insertError) throw insertError;

    res.json({
      success: true,
      message: 'Gallery images uploaded successfully',
      data: galleryData
    });

  } catch (error) {
    console.error('Error uploading gallery images:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to upload gallery images',
      error: error.message
    });
  }
});

// Delete gallery image
router.delete('/gallery/:imageId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;

    // Get company ID
    const { data: company, error: companyError } = await supabaseAdmin
      .from('company_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (companyError) throw companyError;
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    // Get image info before deleting
    const { data: image, error: imageError } = await supabaseAdmin
      .from('company_gallery')
      .select('image_url')
      .eq('id', imageId)
      .eq('company_id', company.id)
      .single();

    if (imageError) throw imageError;

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('company_gallery')
      .delete()
      .eq('id', imageId)
      .eq('company_id', company.id);

    if (deleteError) throw deleteError;

    // Delete file from filesystem
    if (image.image_url) {
      const filePath = path.join(__dirname, '..', image.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({
      success: true,
      message: 'Gallery image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting gallery image:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gallery image',
      error: error.message
    });
  }
});

// Get auto-mails setting
router.get('/auto-mails', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: company, error } = await supabaseAdmin
      .from('company_profiles')
      .select('auto_mails_enabled')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    res.json({
      success: true,
      auto_mails_enabled: company?.auto_mails_enabled || false
    });
  } catch (error) {
    console.error('Error fetching auto-mails setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auto-mails setting',
      error: error.message
    });
  }
});

// Update auto-mails setting
router.put('/auto-mails', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { auto_mails_enabled } = req.body;
    
    if (typeof auto_mails_enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'auto_mails_enabled must be a boolean value'
      });
    }
    
    // Check if company profile exists
    const { data: existingCompany } = await supabaseAdmin
      .from('company_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!existingCompany) {
      // Create a minimal company profile if it doesn't exist
      const { error: insertError } = await supabaseAdmin
        .from('company_profiles')
        .insert({
          user_id: userId,
          company_name: 'Company Name',
          auto_mails_enabled
        });
      
      if (insertError) throw insertError;
    } else {
      // Update existing company profile
      const { error: updateError } = await supabaseAdmin
        .from('company_profiles')
        .update({ auto_mails_enabled })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
    }
    
    res.json({
      success: true,
      message: `Auto mails ${auto_mails_enabled ? 'enabled' : 'disabled'} successfully`,
      auto_mails_enabled
    });
  } catch (error) {
    console.error('Error updating auto-mails setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auto-mails setting',
      error: error.message
    });
  }
});

// Test endpoint to check if company profile tables exist
router.get('/test-tables', authenticateToken, async (req, res) => {
  try {
    console.log('Testing company profile tables...');
    
    // Test company_profiles table
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('company_profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error('company_profiles table error:', profilesError);
      return res.status(500).json({
        success: false,
        message: 'company_profiles table does not exist or has issues',
        error: profilesError.message,
        code: profilesError.code
      });
    }
    
    // Test company_offices table
    const { data: offices, error: officesError } = await supabaseAdmin
      .from('company_offices')
      .select('id')
      .limit(1);
    
    if (officesError) {
      console.error('company_offices table error:', officesError);
      return res.status(500).json({
        success: false,
        message: 'company_offices table does not exist or has issues',
        error: officesError.message,
        code: officesError.code
      });
    }
    
    // Test company_gallery table
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('company_gallery')
      .select('id')
      .limit(1);
    
    if (galleryError) {
      console.error('company_gallery table error:', galleryError);
      return res.status(500).json({
        success: false,
        message: 'company_gallery table does not exist or has issues',
        error: galleryError.message,
        code: galleryError.code
      });
    }
    
    res.json({
      success: true,
      message: 'All company profile tables exist and are accessible',
      tables: ['company_profiles', 'company_offices', 'company_gallery']
    });
    
  } catch (error) {
    console.error('Error testing tables:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing database tables',
      error: error.message
    });
  }
});

module.exports = router;
