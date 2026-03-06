// Email Configuration
// Copy this to your .env file in the server directory

module.exports = {
  // Gmail Configuration (Recommended)
  GMAIL: {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: 587,
    SMTP_USER: 'your-email@gmail.com',
    SMTP_PASS: 'your-16-character-app-password'
  },
  
  // Outlook Configuration
  OUTLOOK: {
    SMTP_HOST: 'smtp-mail.outlook.com',
    SMTP_PORT: 587,
    SMTP_USER: 'your-email@outlook.com',
    SMTP_PASS: 'your-password'
  },
  
  // Yahoo Configuration
  YAHOO: {
    SMTP_HOST: 'smtp.mail.yahoo.com',
    SMTP_PORT: 587,
    SMTP_USER: 'your-email@yahoo.com',
    SMTP_PASS: 'your-app-password'
  }
};

// Instructions:
// 1. Create a .env file in the server directory
// 2. Copy the Gmail configuration above
// 3. Replace 'your-email@gmail.com' with your actual Gmail
// 4. Replace 'your-16-character-app-password' with your Gmail App Password
// 5. For Gmail App Password:
//    - Enable 2-Factor Authentication
//    - Go to Google Account Settings > Security > App Passwords
//    - Generate password for "Mail"
//    - Use that 16-character password
