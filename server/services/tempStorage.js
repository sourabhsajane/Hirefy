// Temporary storage for user data during registration (in production, use Redis)
const tempUserStorage = new Map();

// Store user data temporarily
const storeTempUser = (email, userData) => {
  const expirationTime = Date.now() + (15 * 60 * 1000); // 15 minutes
  tempUserStorage.set(email, {
    ...userData,
    expiresAt: expirationTime
  });
  
  // Clean up expired data
  setTimeout(() => {
    if (tempUserStorage.has(email)) {
      const stored = tempUserStorage.get(email);
      if (stored.expiresAt <= Date.now()) {
        tempUserStorage.delete(email);
      }
    }
  }, 15 * 60 * 1000);
};

// Get user data
const getTempUser = (email) => {
  const stored = tempUserStorage.get(email);
  
  if (!stored) {
    return null;
  }
  
  if (stored.expiresAt <= Date.now()) {
    tempUserStorage.delete(email);
    return null;
  }
  
  return stored;
};

// Remove user data
const removeTempUser = (email) => {
  tempUserStorage.delete(email);
};

module.exports = {
  storeTempUser,
  getTempUser,
  removeTempUser
};
