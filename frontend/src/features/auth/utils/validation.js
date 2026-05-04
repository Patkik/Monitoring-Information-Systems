export const validateEmailDomain = (email) => {
  const allowedDomains = ['student.buksu.edu.ph', 'buksu.edu.ph'];
  const domain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.includes(domain);
};

export const getEmailDomainError = () => 
  'Only institutional emails (student.buksu.edu.ph or buksu.edu.ph) are allowed';

export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validateName = (name) => {
  if (!name || name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  return null;
};
