# 🚀 Hirefy – AI-Powered Recruitment Platform

Hirefy is a full-stack recruitment platform designed to simplify the hiring process by connecting candidates, recruiters, and administrators through a centralized system.

The platform provides role-based workflows for job discovery, recruitment management, candidate profiles, application tracking, resume management, and administrative operations.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [User Modules](#-user-modules)
- [Email & Notification System](#-email--notification-system)
- [Authentication & Security](#-authentication--security)
- [System Architecture](#️-system-architecture)
- [Technology Stack](#️-technology-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Database Setup](#️-database-setup)
- [Gmail Configuration](#-gmail-configuration)
- [Running the Application](#️-running-the-application)
- [Default Development URLs](#-default-development-urls)
- [Testing & Development](#-testing--development)
- [Troubleshooting](#-troubleshooting)
- [Security Guidelines](#-security-guidelines)
- [Future Enhancements](#-future-enhancements)
- [Developer](#-developer)

---

## 📌 Overview

Hirefy provides a complete recruitment workflow for different types of users:

- **Candidates** can create profiles, build resumes, browse jobs, and apply for positions.
- **Recruiters** can create job postings, manage applications, and review candidates.
- **Administrators** can monitor and manage the platform through an administrative dashboard.

The application uses a React-based frontend, Node.js and Express.js backend, and Supabase for database, authentication, and storage services.

---

## ✨ Key Features

### 👨‍💻 Candidate

- Candidate registration and login
- Profile creation and management
- Resume builder
- Resume upload and management
- Job search and browsing
- Job application
- Application tracking
- Skills and education management
- Candidate dashboard
- Email notifications

### 🏢 Recruiter

- Recruiter registration and login
- Recruiter profile management
- Company information management
- Job posting
- Job management
- Applicant review
- Candidate profile viewing
- Application status management
- Recruiter dashboard
- Email notifications

### 🛡️ Admin

- Administrative dashboard
- User management
- Candidate management
- Recruiter management
- Job management
- Application monitoring
- Platform statistics
- Administrative controls

---

## 👥 User Modules

Hirefy is divided into three primary modules:

| Module | Description |
|---|---|
| Candidate | Job discovery, profile management, resume management, and applications |
| Recruiter | Job posting, applicant management, and recruitment workflows |
| Admin | Platform administration, monitoring, and management |

---

## 📧 Email & Notification System

Hirefy integrates email-based communication for recruitment workflows.

### Email Features

- Candidate application notifications
- Recruiter notifications
- Resume-related notifications
- Job-related notifications
- Recruitment status updates

### Technologies

- **Nodemailer**
- **Gmail SMTP**
- **Google AMP Email**

Google AMP Email can be used to provide interactive email experiences for supported workflows.

---

## 🔐 Authentication & Security

The application includes authentication and role-based access control.

### Security Features

- User authentication
- JWT-based authentication
- Role-based authorization
- Protected API routes
- Environment-based configuration
- CORS configuration
- Secure password handling through the authentication system
- Supabase authentication integration
- File upload controls

Sensitive credentials should always be stored in environment variables and should never be committed to GitHub.

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      User Browser    │
                         │ Candidate / Recruiter│
                         │        / Admin       │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   React Frontend     │
                         │      Client          │
                         └──────────┬───────────┘
                                    │
                              REST API Calls
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Node.js + Express  │
                         │      Backend         │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼
             ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
             │  Supabase   │ │   Email     │ │   Storage   │
             │  Database   │ │ Nodemailer  │ │   Service   │
             │    / Auth   │ │   / Gmail   │ │  Supabase   │
             └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- Bootstrap
- React Router

### Backend

- Node.js
- Express.js
- REST APIs
- JWT Authentication
- Nodemailer

### Database & Services

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage

### Email

- Gmail SMTP
- Nodemailer
- Google AMP Email

### Development Tools

- Git
- GitHub
- Visual Studio Code
- npm

---

## 📁 Project Structure

```text
Hirefy/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   ├── uploads/
│   ├── index.js
│   └── package.json
│
├── database/
│
├── .gitignore
├── README.md
└── package.json
```

---

## 📋 Prerequisites

Before running Hirefy locally, make sure you have the following installed:

- Node.js
- npm
- Git
- Supabase account
- Gmail account for email functionality

You can verify Node.js and npm using:

```bash
node --version
npm --version
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sourabhsajane/Hirefy.git
```

### 2. Navigate to the Project

```bash
cd Hirefy
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

## 🔑 Environment Configuration

Create environment files locally and add the required configuration.

### Backend Environment Variables

Create:

```text
server/.env
```

Example:

```env
PORT=5000

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

### Frontend Environment Variables

Create:

```text
client/.env
```

Example:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Never commit `.env` files or real credentials to GitHub.

---

## 🗄️ Database Setup

Hirefy uses **Supabase/PostgreSQL** for database services.

### Setup Steps

1. Create a Supabase project.
2. Configure the required database tables.
3. Configure Supabase authentication.
4. Configure Supabase storage if required.
5. Add the required Supabase environment variables.
6. Start the application.

Make sure the database configuration matches the environment variables used by the backend.

---

## 📧 Gmail Configuration

Email functionality uses Gmail SMTP through Nodemailer.

For Gmail authentication:

1. Enable **2-Step Verification** on your Google account.
2. Create a **Google App Password**.
3. Use the generated App Password in the backend environment configuration.

Example:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

> Do not use your regular Gmail password in the application.

---

## ▶️ Running the Application

### Start the Backend

Open a terminal:

```bash
cd server
npm start
```

The backend will run on the configured port.

### Start the Frontend

Open another terminal:

```bash
cd client
npm start
```

The frontend will start using the configured development port.

---

## 🌐 Default Development URLs

| Service | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:5000` |
| Supabase | Configured through environment variables |

> Ports may vary depending on your local configuration.

---

## 🧪 Testing & Development

During development, test the major workflows for each user role.

### Candidate Testing

- Registration
- Login
- Profile creation
- Resume creation/upload
- Job browsing
- Job application
- Application tracking

### Recruiter Testing

- Registration
- Login
- Company profile
- Job creation
- Job management
- Applicant review
- Application status updates

### Admin Testing

- Authentication
- Dashboard access
- User management
- Recruiter management
- Candidate management
- Job management

---

## 🛠️ Troubleshooting

### Backend Does Not Start

Check:

- Node.js installation
- Backend dependencies
- `.env` configuration
- Port availability
- Supabase configuration

Run:

```bash
npm install
npm start
```

### Frontend Does Not Start

Run:

```bash
cd client
npm install
npm start
```

### Database Connection Issues

Check:

- Supabase project status
- Supabase URL
- Supabase keys
- Database configuration
- Environment variable names

### Email Is Not Working

Check:

- Gmail account configuration
- 2-Step Verification
- Google App Password
- `EMAIL_USER`
- `EMAIL_PASSWORD`

---

## 🔒 Security Guidelines

For production deployment:

- Never commit `.env` files.
- Never expose Supabase service-role credentials on the frontend.
- Use strong JWT secrets.
- Use HTTPS.
- Validate user input.
- Restrict CORS appropriately.
- Validate uploaded files.
- Apply proper authorization to protected routes.
- Keep dependencies updated.
- Do not commit generated uploads or sensitive user files.

---

## 🚀 Future Enhancements

Potential improvements include:

- AI-powered candidate-job matching
- Advanced recruiter analytics
- Resume parsing
- Automated candidate recommendations
- Advanced search and filtering
- Interview scheduling
- Real-time notifications
- Recruitment analytics
- Background job processing
- Improved email automation
- Mobile application support

---

## 👨‍💻 Developer

**Sourabh Sajane**

- GitHub: https://github.com/sourabhsajane
- LinkedIn: https://www.linkedin.com/in/sourabh-sajane

---

## ⭐ Hirefy

**Hirefy – Simplifying the Recruitment Journey**

Built with modern web technologies to create a structured and efficient recruitment experience for candidates, recruiters, and administrators.