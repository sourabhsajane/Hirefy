const nodemailer = require('nodemailer');
const { supabaseAdmin } = require('../config/supabase');

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });
};

// Generate Google AMP email template for skill updates
const generateAMPEmailTemplate = (candidate, job, recruiterId) => {
  // Create comma-separated list of skills for the URL
  const allSkillsParam = job.skills_required && job.skills_required.length > 0 
    ? encodeURIComponent(job.skills_required.join(',')) 
    : '';
  
  const ampTemplate = `<!doctype html>
<html ⚡4email data-css-strict>
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <style amp4email-boilerplate>body{visibility:hidden}</style>
  <style amp-custom>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        padding: 20px;
        background-color: #f8fafc;
        margin: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, #fbbf24 0%, #1f2937 100%);
        color: white;
        padding: 30px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
      }
      .content {
        padding: 30px;
      }
      .job-card {
        background: #f8fafc;
        border-left: 4px solid #fbbf24;
        padding: 20px;
        margin: 20px 0;
        border-radius: 8px;
      }
      .job-title {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 10px;
      }
      .job-meta {
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 5px;
      }
      .skills-section {
        margin-top: 30px;
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      .skills-section h3 {
        color: #1f2937;
        font-size: 18px;
        margin-bottom: 15px;
      }
      .skills-input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        box-sizing: border-box;
        background: white;
        margin-bottom: 15px;
      }
      .skills-input:focus {
        outline: none;
        border-color: #fbbf24;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 12px 30px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        margin: 10px 5px;
        text-align: center;
      }
      .cta-button.primary {
        background: linear-gradient(135deg, #fbbf24 0%, #1f2937 100%);
      }
      .footer {
        background: #1f2937;
        color: white;
        padding: 20px;
        text-align: center;
        font-size: 12px;
      }
      .skill-examples {
        background: #ffffff;
        padding: 15px;
        border-radius: 6px;
        margin-bottom: 15px;
        border: 1px solid #d1d5db;
      }
      .skill-examples p {
        margin: 0 0 10px 0;
        font-size: 13px;
        color: #6b7280;
      }
      .skill-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .skill-tag {
        background: #fbbf24;
        color: #1f2937;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>New Job Opportunity!</h1>
      </div>
      
      <div class="content">
        <p>Hi ${candidate.name},</p>
        <p>We have a new job opportunity that might interest you:</p>
        
        <div class="job-card">
          <div class="job-title">${job.title}</div>
          <div class="job-meta">Location: ${job.location}</div>
          <div class="job-meta">Type: ${job.employment_type}</div>
          ${job.salary_min && job.salary_max ? `<div class="job-meta">Salary: ₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}</div>` : ''}
          ${job.experience_required !== undefined ? `<div class="job-meta">Experience: ${job.experience_required === 0 ? 'Entry Level' : job.experience_required + '+ years'}</div>` : ''}
        </div>
        
        <p><strong>Update your skills to match this opportunity!</strong></p>
        
      <div class="skills-section">
        <h3>🎯 Select Your Skills</h3>
        <p style="font-size: 14px; color: #4b5563; margin-bottom: 20px;">
          Check the skills you have and click submit to add them to your profile!
        </p>
        
        ${job.skills_required && job.skills_required.length > 0 ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-weight: 600; color: #1f2937; margin-bottom: 15px;">Required skills for this position:</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
              ${job.skills_required.map((skill, index) => `
                <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8fafc; border-radius: 8px; cursor: pointer; border: 2px solid #e2e8f0;">
                  <input 
                    type="checkbox" 
                    id="skill_${index}"
                    value="${skill}"
                    style="width: 20px; height: 20px; cursor: pointer; accent-color: #fbbf24;"
                  />
                  <span style="font-size: 15px; color: #1f2937; font-weight: 500;">${skill}</span>
                </label>
              `).join('')}
            </div>
            
            <div style="text-align: center;">
              <a 
                href="http://localhost:3000/profile?skills=${allSkillsParam}"
                class="cta-button primary"
                style="cursor: pointer; border: none; font-size: 16px; padding: 14px 40px; display: inline-block; text-decoration: none;"
              >
                ✨ Add Selected Skills to My Profile
              </a>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px dashed #e2e8f0; text-align: center;">
              <p style="font-size: 13px; color: #6b7280; margin-bottom: 10px;">💡 Checkboxes don't work in Gmail AMP. Use the button above to add all skills, or click individual skill buttons below:</p>
              <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 10px;">
                ${job.skills_required.map(skill => `
                  <a 
                    href="http://localhost:3000/profile?skills=${encodeURIComponent(skill)}"
                    style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #1f2937 100%); color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;"
                  >
                    ✨ ${skill}
                  </a>
                `).join('')}
              </div>
            </div>
          </div>
        ` : `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #78350f;">No specific skills required for this job. Visit your profile to add skills manually.</p>
          <a href="http://localhost:3000/profile" class="cta-button primary" style="margin-top: 15px; display: inline-block;">
            Go to Profile
          </a>
        </div>
        `}
        
        <p style="text-align: center; margin-top: 25px;">
          <a href="http://localhost:3000/dashboard" class="cta-button" style="background: #6b7280; text-decoration: none;">
            👀 View Job Details
          </a>
        </p>
      </div>
      </div>
      
      <div class="footer">
        <p>© 2025 Hirefy. All rights reserved.</p>
        <p>You received this email because you're a registered candidate on Hirefy.</p>
      </div>
    </div>
  </body>
  </html>`;
  
  return ampTemplate;
};

// Generate fallback HTML template for non-Gmail users
const generateFallbackEmailTemplate = (candidate, job) => {
  const fallbackTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f8fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #fbbf24 0%, #1f2937 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 30px;
      color: #1f2937;
    }
    .job-card {
      background: #f8fafc;
      border-left: 4px solid #fbbf24;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .job-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .job-meta {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 15px;
    }
    .profile-button {
      display: inline-block;
      background: linear-gradient(135deg, #fbbf24 0%, #1f2937 100%);
      color: white;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 10px 5px;
    }
    .button-container {
      text-align: center;
      margin-top: 30px;
    }
    .footer {
      background: #1f2937;
      color: white;
      padding: 20px;
      text-align: center;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Job Opportunity!</h1>
    </div>
    
    <div class="content">
      <p>Hi ${candidate.name},</p>
      <p>We have a new job opportunity that might interest you:</p>
      
      <div class="job-card">
        <div class="job-title">${job.title}</div>
        <div class="job-meta">📍 Location: ${job.location}</div>
        <div class="job-meta">💼 Type: ${job.employment_type}</div>
        ${job.salary_min && job.salary_max ? `<div class="job-meta">💰 Salary: ₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}</div>` : ''}
        ${job.experience_required !== undefined ? `<div class="job-meta">⭐ Experience: ${job.experience_required === 0 ? 'Entry Level' : job.experience_required + '+ years'}</div>` : ''}
        <p style="margin-top: 15px; color: #4b5563;">${job.description}</p>
      </div>
      
      ${job.skills_required && job.skills_required.length > 0 ? `
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #fbbf24;">
        <h3 style="color: #1f2937; margin-top: 0;">🎯 Click to Add Skills</h3>
        <p style="color: #4b5563; font-size: 14px;">Click on the skills you have to add them to your profile instantly!</p>
        
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; justify-content: center;">
          ${job.skills_required.map(skill => `
            <a 
              href="http://localhost:3000/profile?skills=${encodeURIComponent(skill)}"
              style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #1f2937 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; transition: transform 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
            >
              ✨ ${skill}
            </a>
          `).join('')}
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px dashed #e2e8f0; text-align: center;">
          <p style="font-size: 13px; color: #6b7280; margin-bottom: 10px;">Or add all skills at once:</p>
          <a 
            href="http://localhost:3000/profile?skills=${encodeURIComponent(job.skills_required.join(','))}"
            style="display: inline-block; background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%); color: #1e40af; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;"
          >
            ⚡ Add All ${job.skills_required.length} Skills
          </a>
        </div>
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 15px;">
          💡 Tip: Click multiple buttons to add all your skills!
        </p>
      </div>
      ` : ''}
      
      <div class="button-container">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/profile" class="profile-button">
          Update Profile & Skills
        </a>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
          View Job Details
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>© 2024 Hirefy. All rights reserved.</p>
      <p>You received this email because you're a registered candidate on Hirefy.</p>
    </div>
  </div>
</body>
</html>
  `;
  
  return fallbackTemplate;
};

// Send new job notification to all candidates
const sendNewJobNotifications = async (job, recruiterId) => {
  try {
    // Fetch all candidates
    const { data: candidates, error: candidatesError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('role', 'candidate');

    if (candidatesError) throw candidatesError;

    if (!candidates || candidates.length === 0) {
      console.log('No candidates found to send emails');
      return { success: true, message: 'No candidates to notify' };
    }

    const transporter = createTransporter();
    const emailPromises = [];

    for (const candidate of candidates) {
      const ampTemplate = generateAMPEmailTemplate(candidate, job, recruiterId);
      const fallbackTemplate = generateFallbackEmailTemplate(candidate, job);

      const mailOptions = {
        from: `"Hirefy Jobs" <${process.env.EMAIL_USER || 'noreply@hirefy.com'}>`,
        to: candidate.email,
        subject: `🎯 New Job: ${job.title} - Update Your Skills!`,
        html: fallbackTemplate,
        // Google AMP email as alternative
        amp: ampTemplate
      };

      emailPromises.push(
        transporter.sendMail(mailOptions)
          .then(() => {
            console.log(`✅ Email sent to ${candidate.email}`);
            return { success: true, email: candidate.email };
          })
          .catch((err) => {
            console.error(`❌ Failed to send email to ${candidate.email}:`, err.message);
            return { success: false, email: candidate.email, error: err.message };
          })
      );
    }

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`📧 Email Summary: ${successCount} sent, ${failureCount} failed`);

    return {
      success: true,
      message: `Emails sent to ${successCount} candidates`,
      details: { successCount, failureCount, total: candidates.length }
    };

  } catch (error) {
    console.error('Error sending job notifications:', error);
    return {
      success: false,
      message: 'Failed to send notifications',
      error: error.message
    };
  }
};

// Send OTP Email for registration
const sendOTPEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: '🔐 Verify Your Hirefy Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f8f9fa;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .otp-box {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              padding: 20px;
              border-radius: 12px;
              margin: 30px 0;
              display: inline-block;
            }
            .info {
              color: #6c757d;
              font-size: 14px;
              margin-top: 20px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #6c757d;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Welcome to Hirefy!</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px; color: #333; margin-bottom: 10px;">
                Hi <strong>${name}</strong>! 👋
              </p>
              <p style="color: #6c757d; margin-bottom: 30px;">
                Thank you for signing up! Please verify your email address by entering the code below:
              </p>
              
              <div class="otp-box">
                ${otp}
              </div>
              
              <p class="info">
                ⏱️ This code will expire in <strong>10 minutes</strong>
              </p>
              <p class="info">
                🔒 If you didn't request this code, please ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Hirefy. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send Password Reset OTP Email
const sendPasswordResetOTPEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: '🔐 Reset Your Hirefy Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f8f9fa;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .otp-box {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              padding: 20px;
              border-radius: 12px;
              margin: 30px 0;
              display: inline-block;
            }
            .info {
              color: #6c757d;
              font-size: 14px;
              margin-top: 20px;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              text-align: left;
              border-radius: 8px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #6c757d;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px; color: #333; margin-bottom: 10px;">
                Hi <strong>${name}</strong>! 👋
              </p>
              <p style="color: #6c757d; margin-bottom: 30px;">
                We received a request to reset your password. Use the code below to proceed:
              </p>
              
              <div class="otp-box">
                ${otp}
              </div>
              
              <p class="info">
                ⏱️ This code will expire in <strong>10 minutes</strong>
              </p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </div>
            </div>
            <div class="footer">
              <p>© 2025 Hirefy. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send Welcome Email
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: '🎉 Welcome to Hirefy!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f8f9fa;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 40px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #6c757d;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Hirefy!</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px; color: #333;">
                Hi <strong>${name}</strong>! 👋
              </p>
              <p style="color: #6c757d; margin: 20px 0;">
                Congratulations! Your account has been successfully created. You're now part of the Hirefy community!
              </p>
              <p style="color: #6c757d; margin: 20px 0;">
                Get started by exploring job opportunities and building your professional profile.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
                  Go to Dashboard
                </a>
              </div>
              <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
                Need help? Contact our support team anytime.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Hirefy. All rights reserved.</p>
              <p>You're receiving this email because you signed up for Hirefy.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Generic email sending function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Hirefy" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@hirefy.com'}>`,
      to,
      subject,
      html,
      text
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendNewJobNotifications,
  generateAMPEmailTemplate,
  generateFallbackEmailTemplate,
  createTransporter,
  sendOTPEmail,
  sendPasswordResetOTPEmail,
  sendWelcomeEmail
};
