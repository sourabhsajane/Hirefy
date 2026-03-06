# 🚀 Hirefy - Job Portal Application

A modern, full-stack job portal built with React, Node.js, Express, and PostgreSQL (Supabase).

---

## 📋 Table of Contents
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [User Roles](#user-roles)

---

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- React Router DOM
- Bootstrap 5 + React-Bootstrap
- Axios
- CSS3 with animations

### Backend
- Node.js + Express.js
- JWT Authentication
- bcrypt for password hashing
- Multer for file uploads
- Nodemailer for emails
- Supabase (PostgreSQL)

### Special Features
- Google AMP for Email
- Auto Mail Notifications
- Role-based Dashboards
- File Upload System

---

## ✨ Features

### For Candidates
- Browse and search jobs
- Apply for jobs with resume upload
- Manage profile and skills
- Receive email notifications for new jobs
- Update skills directly from emails (Gmail)

### For Recruiters
- Post and manage jobs
- View applications with candidate details
- Download candidate resumes
- Auto mail feature for candidate notifications
- Company profile management

### For Admin
- View all candidates
- View all recruiters
- View all jobs
- View all applications
- Dashboard with statistics

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

---

## 🚀 Installation

### Step 1: Clone or Extract the Project
```bash
# If using Git
git clone <repository-url>
cd Hirefy-new

# Or simply extract the ZIP file and navigate to the folder
```

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

### Step 3: Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

---

## ⚙️ Configuration

### Step 1: Create Environment File

Create a `.env` file in the `server` folder:

```bash
cd server
# Create .env file (use notepad or any text editor)
```

### Step 2: Add Environment Variables

Add the following to your `.env` file:

```env
# Server Configuration
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here-change-this

# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# URLs
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
```

### Step 3: Gmail App Password Setup (For Emails)

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable **2-Step Verification**
3. Go to **App Passwords**
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Use it as `SMTP_PASS` in your `.env` file

### Step 4: Supabase Setup

1. Create account at [Supabase](https://supabase.com/)
2. Create a new project
3. Get your API keys from Project Settings → API
4. Update `.env` with your Supabase credentials

---

## 🏃 Running the Application

### Option 1: Run Both (Recommended)

Open **TWO** terminal windows:

#### Terminal 1 - Backend:
```bash
cd server
npm run dev
```
**Backend will run on:** `http://localhost:5000`

#### Terminal 2 - Frontend:
```bash
cd client
npm start
```
**Frontend will run on:** `http://localhost:3000`

---

## 🐛 Troubleshooting

### ⚠️ Punycode Deprecation Warning

If you see this warning:
```
(node:xxxxx) [DEP0040] DeprecationWarning: The `punycode` module is deprecated.
```

**DON'T WORRY!** This is just a warning and won't break your application.

#### Why does this happen?
- Some npm packages (like `nodemailer` or `whatwg-url`) use an old version of the `punycode` module
- Node.js v20+ shows this deprecation warning
- It's harmless and doesn't affect functionality

#### How to fix it:

**Option 1: Ignore the Warning (Recommended)**
- The application will work perfectly fine
- Wait for package maintainers to update their dependencies
- No action needed

**Option 2: Use Node.js v18 LTS**
```bash
# Install Node Version Manager (nvm)
# For Windows: Download nvm-windows from https://github.com/coreybutler/nvm-windows

# Install and use Node.js v18
nvm install 18
nvm use 18

# Verify
node --version  # Should show v18.x.x

# Reinstall dependencies
cd server
rm -rf node_modules package-lock.json
npm install

cd ../client
rm -rf node_modules package-lock.json
npm install
```

**Option 3: Suppress the Warning (Development Only)**
```bash
# Windows PowerShell
cd server
$env:NODE_OPTIONS="--no-deprecation"; npm run dev

# Windows CMD
cd server
set NODE_OPTIONS=--no-deprecation && npm run dev

# macOS/Linux
cd server
NODE_OPTIONS=--no-deprecation npm run dev
```

**Option 4: Update package.json scripts (Permanent Fix)**

Edit `server/package.json`:
```json
{
  "scripts": {
    "dev": "NODE_OPTIONS=--no-deprecation nodemon index.js",
    "start": "NODE_OPTIONS=--no-deprecation node index.js"
  }
}
```

For **Windows**, edit `server/package.json`:
```json
{
  "scripts": {
    "dev": "SET NODE_OPTIONS=--no-deprecation && nodemon index.js",
    "start": "SET NODE_OPTIONS=--no-deprecation && node index.js"
  }
}
```

---

### 🔥 Other Common Issues

#### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

#### Module Not Found
```bash
# Delete node_modules and reinstall
cd server
rm -rf node_modules package-lock.json
npm install

cd ../client
rm -rf node_modules package-lock.json
npm install
```

#### CORS Errors
- Make sure backend is running on port 5000
- Make sure frontend is running on port 3000
- Check `.env` file has correct URLs

#### Email Not Sending
- Verify Gmail App Password is correct
- Enable "Less secure app access" or use App Password
- Check SMTP settings in `.env`

---

## 👥 User Roles

### Admin
- **Email:** `admin@hirefy.com`
- **Access:** Full system access, view all data, analytics

### Recruiter
- **Signup:** Create account with "Recruiter" role
- **Access:** Post jobs, view applications, company profile

### Candidate
- **Signup:** Create account with "Candidate" role
- **Access:** Browse jobs, apply, manage profile

---

## 📁 Project Structure

```
Hirefy-new/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/         # API utilities
│   │   ├── App.tsx        # Main app component
│   │   └── index.tsx      # Entry point
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── config/            # Database config
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   ├── services/          # Email service
│   ├── uploads/           # Uploaded files
│   ├── index.js           # Server entry point
│   └── package.json
│
├── .env                    # Environment variables (create this)
└── README.md              # This file
```

---

## 🎯 Default URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

---

## 📧 Email Features

### Auto Mails
- Automatically send job notifications to all candidates
- Toggle ON/OFF in recruiter dashboard
- Gmail users get interactive AMP emails
- Other users get clickable HTML emails

### AMP Email Features (Gmail Only)
- Update skills directly from email
- Interactive checkboxes
- No need to visit website

---

## 🔒 Security Notes

1. **Never commit `.env` file** to version control
2. Change `JWT_SECRET` to a strong random string
3. Use **App Passwords** for Gmail, not your account password
4. Keep your Supabase keys secret
5. Enable HTTPS in production

---

## 🚀 Deployment

For production deployment:

1. Set up a cloud server (AWS, DigitalOcean, Heroku, etc.)
2. Update environment variables with production URLs
3. Build frontend: `npm run build` in client folder
4. Use a process manager like PM2 for the backend
5. Set up a reverse proxy (Nginx) for better performance
6. Enable HTTPS with SSL certificate

---

## 📝 Notes

- Make sure both backend and frontend are running
- Backend must start before frontend for proper functionality
- Check console logs for any errors
- The punycode warning is **harmless** and can be ignored

---

## 🆘 Need Help?

If you encounter any issues:

1. Check all dependencies are installed
2. Verify `.env` configuration
3. Ensure ports 3000 and 5000 are not in use
4. Check console logs for detailed error messages
5. Make sure Supabase database is set up correctly

---

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ using React, Node.js, Express, and PostgreSQL**

🎉 **Happy Coding!** 🚀

