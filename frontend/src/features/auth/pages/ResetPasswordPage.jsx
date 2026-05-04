import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthLayout from './AuthLayout.jsx';
import { resetPassword, mapErrorCodeToMessage } from '../services/api.js';

export default function ResetPasswordPage() {
 const { token } = useParams();
 const navigate = useNavigate();
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 const onSubmit = async (e) => {
 e.preventDefault();
 setError('');
 setLoading(true);
 try {
 await resetPassword(token, { password });
 navigate('/login');
 } catch (err) {
 const code = err?.response?.data?.error;
 setError(mapErrorCodeToMessage(code));
 } finally {
 setLoading(false);
 }
 };

 return (
 <AuthLayout 
  title="Create your\nnew password." 
  subtitle="Set a strong password to secure your account."
 >
  <header className="tw-mb-8">
    <p className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-primary">Reset Password</p>
    <h2 className="login-redesign__form-title tw-mt-2 tw-leading-[1.02] tw-text-[#1d2931]">
      Almost
      <br />
      there.
    </h2>
  </header>

 <form onSubmit={onSubmit} className="tw-space-y-4">
 {error && <div className="tw-p-3 tw-rounded-xl tw-bg-red-50 tw-text-red-700 tw-text-sm ">{error}</div>}
 
 {/* Password Input with Icon */}
 <div className="tw-relative">
 <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
 <svg className="tw-h-5 tw-w-5 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
 </svg>
 </div>
 <input 
 type="password" 
 value={password} 
 onChange={(e)=>setPassword(e.target.value)} 
 placeholder="Enter new password" 
 className="tw-w-full tw-h-12 tw-pl-11 tw-pr-4 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-[#fbfcfd] focus:tw-bg-white focus:tw-border-primary focus:tw-ring-4 focus:tw-ring-primary/15 tw-outline-none tw-transition" 
 required 
 />
 </div>

 {/* Verify Button */}
 <button 
 disabled={loading} 
 className="tw-w-full tw-h-[52px] tw-rounded-xl tw-bg-primary hover:tw-bg-primary-dark tw-text-white tw-font-semibold tw-tracking-[0.14em] tw-uppercase tw-transition tw-shadow-[0_10px_30px_rgba(91,22,163,0.35)] hover:tw--translate-y-[1px] disabled:tw-opacity-70 disabled:tw-transform-none"
 >
 {loading ? 'Saving...' : 'Verify'}
 </button>
 </form>
 </AuthLayout>
 );
}


