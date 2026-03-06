const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { sendWelcomeEmail, sendOTPEmail, sendPasswordResetOTPEmail } = require('../services/emailService');
const { generateOTP, storeOTP, verifyOTP } = require('../services/otpService');
const { storeTempUser, getTempUser, removeTempUser } = require('../services/tempStorage');

const router = express.Router();

// Register new user (direct registration without OTP for testing)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('name').trim().isLength({ min: 2 }).matches(/^[a-zA-Z\s]+$/),
  body('phone').matches(/^\+\d{1,4}\d{10}$/),
  body('role').isIn(['candidate', 'recruiter', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: getValidationMessage(err.path, err.msg)
        }))
      });
    }

    const { email, password, name, phone, role } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP for verification
    storeOTP(email, otp);
    
    // Store user data temporarily for OTP verification
    const tempUserData = {
      email,
      password,
      name,
      phone,
      role,
      createdAt: new Date()
    };
    
    storeTempUser(email, tempUserData);

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name);
    
    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    console.log(`📧 OTP sent to ${email} for user: ${name}`);

    res.status(200).json({
      message: 'Verification code sent to your email. Please check your inbox.',
      email: email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Helper function for validation messages
function getValidationMessage(field, defaultMsg) {
  const messages = {
    name: 'Name should contain only letters and spaces',
    password: 'Password must be at least 8 characters with uppercase, lowercase, digit, and special character',
    phone: 'Phone number must be in format: +[country code][10 digits]',
    email: 'Please enter a valid email address'
  };
  return messages[field] || defaultMsg;
}

// Verify OTP and complete registration
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Verify OTP
    const otpResult = verifyOTP(email, otp);
    
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.message });
    }

    // Get user data from temporary storage
    const userData = getTempUser(email);
    
    if (!userData) {
      return res.status(400).json({ message: 'Registration session expired. Please register again.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user in database
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          phone: userData.phone,
          role: userData.role
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to create user' });
    }

    // Send welcome email
    await sendWelcomeEmail(email, userData.name);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Clear temporary data
    removeTempUser(email);

    res.status(201).json({
      message: 'Email verified successfully! Welcome to Hirefy!',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Resend OTP
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate new OTP
    const otp = generateOTP();
    storeOTP(email, otp);

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, 'User');
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    // Log OTP for development (remove in production)
    if (emailResult.mock) {
      console.log(`🔐 Development OTP for ${email}: ${otp}`);
    }

    res.status(200).json({
      message: 'New verification OTP sent to your email.',
      email: email
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP resend' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    }
  });
});

// Forgot Password - Request OTP
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    
    // Store OTP for verification (with shorter expiration for password reset)
    storeOTP(email, otp);
    
    // Store user data temporarily for password reset
    const tempUserData = {
      email,
      userId: user.id,
      name: user.name,
      type: 'password_reset',
      createdAt: new Date()
    };
    
    storeTempUser(email, tempUserData);

    // Send Password Reset OTP email
    const emailResult = await sendPasswordResetOTPEmail(email, otp, user.name);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset OTP email:', emailResult.error);
      return res.status(500).json({ 
        message: 'Failed to send password reset email. Please try again.' 
      });
    }

    console.log(`📧 Password reset OTP sent to ${email} for user: ${user.name}`);

    res.status(200).json({
      message: 'Password reset code sent to your email. Please check your inbox.',
      email: email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
});

// Verify OTP for Password Reset
router.post('/verify-reset-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Verify OTP
    const otpResult = verifyOTP(email, otp);
    
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.message });
    }

    // Get user data from temp storage
    const tempUserData = getTempUser(email);
    
    if (!tempUserData || tempUserData.type !== 'password_reset') {
      return res.status(400).json({ message: 'Invalid or expired password reset request' });
    }

    // Verify user still exists
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't remove temp data yet - we need it for password reset
    // Just mark as verified by updating the temp data
    const updatedTempData = {
      ...tempUserData,
      verified: true,
      verifiedAt: new Date()
    };
    
    // Update temp storage with verification status
    storeTempUser(email, updatedTempData);

    res.status(200).json({
      message: 'OTP verified successfully. You can now reset your password.',
      email: email,
      verified: true
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Reset Password
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, otp } = req.body;

    // Get user data from temp storage (OTP already verified in previous step)
    const tempUserData = getTempUser(email);
    
    if (!tempUserData || tempUserData.type !== 'password_reset' || !tempUserData.verified) {
      return res.status(400).json({ message: 'Invalid or expired password reset request. Please verify your OTP first.' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ message: 'Failed to update password' });
    }

    // Clean up temp data
    removeTempUser(email);

    console.log(`🔐 Password reset successful for user: ${email}`);

    res.status(200).json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

module.exports = router;
