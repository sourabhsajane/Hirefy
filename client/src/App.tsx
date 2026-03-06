import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import OTPVerification from './components/OTPVerification';
import ForgotPassword from './components/ForgotPassword';
import CandidateDashboard from './components/CandidateDashboard';
import CandidateProfile from './components/CandidateProfile';
import CompanyProfile from './components/CompanyProfile';
import RecruiterDashboard from './components/RecruiterDashboard';
import AdminDashboard from './components/AdminDashboard';
import AboutUs from './components/AboutUs';
import Navbar from './components/Navbar';

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/admin/dashboard';

  return (
    <div className="App">
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          <Route path="/profile" element={<CandidateProfile />} />
          <Route path="/company-profile" element={<CompanyProfile />} />
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
