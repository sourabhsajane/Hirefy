const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const profileRoutes = require('./routes/profile');
const companyRoutes = require('./routes/company');
const applicationRoutes = require('./routes/applications');
const adminRoutes = require('./routes/admin');

// Load environment variables
dotenv.config();

// Debug: Log environment variables (remove in production)
console.log('🔍 Environment Variables Debug:');
console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'Not set');

// Set fallback JWT secret for development
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'development_jwt_secret_key_please_change_in_production';
  console.log('⚠️  Using development JWT secret. Please set JWT_SECRET in production.');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/api/profile/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Hirefy server is running!' });
});

// Test SMTP endpoint
app.get('/api/test-smtp', async (req, res) => {
  const { testSMTPConnection, isSMTPConfigured } = require('./services/emailService');
  
  if (!isSMTPConfigured()) {
    return res.json({ 
      success: false, 
      message: 'SMTP not configured. Please set SMTP_USER and SMTP_PASS in .env file',
      instructions: 'See email-config.js for setup instructions'
    });
  }
  
  const result = await testSMTPConnection();
  res.json(result);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
