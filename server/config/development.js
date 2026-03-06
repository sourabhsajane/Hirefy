// Development configuration
module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'development_jwt_secret_key_please_change_in_production',
  
  // SMTP Configuration
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT) || 587,
    USER: process.env.SMTP_USER || 'your-email@gmail.com',
    PASS: process.env.SMTP_PASS || 'your-app-password'
  },
  
  // Supabase Configuration
  SUPABASE: {
    URL: process.env.SUPABASE_URL || '',
    ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  }
};
