import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

export const api = axios.create({ baseURL: API_BASE, withCredentials: true });

export const register = (data) => api.post('/auth/register', data).then(r => r.data);
export const login = (data) => api.post('/auth/login', data).then(r => r.data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data).then(r => r.data);
export const verifyCode = (data) => api.post('/auth/verify-code', data).then(r => r.data);
export const verifyResetCode = (data) => api.post('/auth/verify-reset-code', data).then(r => r.data);
export const resetPassword = (token, data) => api.post(`/auth/reset-password/${token}`, data).then(r => r.data);

const buildOAuthUrl = (path) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

export const googleOAuthUrl = () => buildOAuthUrl('/auth/google');
export const facebookOAuthUrl = () => buildOAuthUrl('/auth/facebook');

export const mapErrorCodeToMessage = (code) => {
  switch (code) {
    case 'INVALID_CREDENTIALS': return 'Invalid email or password.';
    case 'EMAIL_EXISTS': return 'An account with this email already exists.';
    case 'ACCOUNT_LOCKED': return 'Account locked due to failed attempts. Try again later.';
    case 'ACCOUNT_DEACTIVATED': return 'This account has been deactivated. Contact an administrator to regain access.';
    case 'INVALID_TOKEN': return 'Invalid or expired token.';
    case 'INVALID_CODE': return 'Invalid or expired code. Please try again.';
    // reCAPTCHA specific errors
    case 'RECAPTCHA_REQUIRED': return 'Please complete the verification step.';
    case 'RECAPTCHA_FAILED': return 'Verification failed. Please try again.';
    case 'RECAPTCHA_ERROR': return 'Verification service error. Please try again shortly.';
    case 'RECAPTCHA_UPSTREAM_ERROR': return 'Unable to verify with reCAPTCHA. Try again later.';
    case 'RECAPTCHA_NOT_CONFIGURED': return 'Verification is temporarily unavailable. Please contact support.';
    // Generic server/network
    case 'NETWORK_ERROR': return 'A server error occurred. Please try again.';
    case 'SERVER_ERROR': return 'A server error occurred. Please try again.';
    default: return 'Network error. Please try again.';
  }};


