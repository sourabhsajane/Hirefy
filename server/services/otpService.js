// In-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map();

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with expiration
const storeOTP = (email, otp) => {
  const expirationTime = Date.now() + (10 * 60 * 1000); // 10 minutes
  otpStorage.set(email, {
    otp,
    expiresAt: expirationTime,
    attempts: 0
  });
  
  // Clean up expired OTPs
  setTimeout(() => {
    if (otpStorage.has(email)) {
      const stored = otpStorage.get(email);
      if (stored.expiresAt <= Date.now()) {
        otpStorage.delete(email);
      }
    }
  }, 10 * 60 * 1000);
};

// Verify OTP
const verifyOTP = (email, inputOTP) => {
  const stored = otpStorage.get(email);
  
  if (!stored) {
    return { success: false, message: 'OTP not found or expired' };
  }
  
  if (stored.expiresAt <= Date.now()) {
    otpStorage.delete(email);
    return { success: false, message: 'OTP has expired' };
  }
  
  if (stored.attempts >= 3) {
    otpStorage.delete(email);
    return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }
  
  if (stored.otp !== inputOTP) {
    stored.attempts += 1;
    return { success: false, message: 'Invalid OTP' };
  }
  
  // OTP is correct, remove it
  otpStorage.delete(email);
  return { success: true, message: 'OTP verified successfully' };
};

// Check if OTP exists for email
const hasOTP = (email) => {
  const stored = otpStorage.get(email);
  return stored && stored.expiresAt > Date.now();
};

// Get OTP info (for debugging)
const getOTPInfo = (email) => {
  const stored = otpStorage.get(email);
  if (!stored) return null;
  
  return {
    expiresAt: stored.expiresAt,
    attempts: stored.attempts,
    timeLeft: Math.max(0, Math.floor((stored.expiresAt - Date.now()) / 1000))
  };
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  hasOTP,
  getOTPInfo
};
