import React, { useRef, useState } from 'react';
import AuthLayout from './AuthLayout.jsx';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const buildApiUrl = (path) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/auth/set-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Failed to set password.');
        return;
      }

      setSuccess('Your password has been set. Redirecting...');
      // Refresh profile to update passwordSet + redirect by role/status
      setTimeout(async () => {
        try {
          const profileRes = await fetch(buildApiUrl('/auth/profile'), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileRes.ok) {
            const user = await profileRes.json();
            localStorage.setItem('user', JSON.stringify(user));
            const role = user.role;
            const applicationStatus = user.applicationStatus || 'not_submitted';
            if (!role) {
              window.location.href = '/role-selection';
            } else if (role === 'admin') {
              window.location.href = applicationStatus === 'approved' ? '/admin/dashboard' : '/admin/pending';
            } else if (role === 'mentor') {
              if (applicationStatus === 'approved') window.location.href = '/mentor/dashboard';
              else if (applicationStatus === 'pending') window.location.href = '/mentor/pending';
              else window.location.href = '/mentor/application';
            } else if (role === 'mentee') {
              if (applicationStatus === 'approved') window.location.href = '/mentee/dashboard';
              else if (applicationStatus === 'pending') window.location.href = '/mentee/pending';
              else window.location.href = '/mentee/application';
            } else {
              window.location.href = '/';
            }
          } else {
            window.location.href = '/';
          }
        } catch {
          window.location.href = '/';
        }
      }, 1200);
    } catch {
      setError('Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Set your\npassword." 
      subtitle="Secure your account to enable email/password login."
    >
      <header className="tw-mb-8">
        <p className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-primary">Set Password</p>
        <h2 className="login-redesign__form-title tw-mt-2 tw-leading-[1.02] tw-text-[#1d2931]">
          Secure your
          <br />
          account.
        </h2>
      </header>

      <form ref={formRef} onSubmit={onSubmit} className="tw-space-y-4">
        {error && <div className="tw-p-3 tw-rounded-xl tw-bg-red-50 tw-text-red-700 tw-text-sm">{error}</div>}
        {success && <div className="tw-p-3 tw-rounded-xl tw-bg-green-50 tw-text-green-700 tw-text-sm">{success}</div>}

        <div>
          <label className="tw-block tw-mb-2 tw-text-[11px] tw-font-semibold tw-tracking-[0.14em] tw-uppercase tw-text-slate-500">New password</label>
          <div className="tw-relative">
            <svg className="tw-absolute tw-h-4 tw-w-4 tw-left-4 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="tw-w-full tw-h-12 tw-pl-11 tw-pr-4 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-[#fbfcfd] focus:tw-bg-white focus:tw-border-primary focus:tw-ring-4 focus:tw-ring-primary/15 tw-outline-none tw-transition"
              minLength={8}
              placeholder="........"
              required
            />
          </div>
        </div>

        <div>
          <label className="tw-block tw-mb-2 tw-text-[11px] tw-font-semibold tw-tracking-[0.14em] tw-uppercase tw-text-slate-500">Confirm password</label>
          <div className="tw-relative">
            <svg className="tw-absolute tw-h-4 tw-w-4 tw-left-4 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="tw-w-full tw-h-12 tw-pl-11 tw-pr-4 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-[#fbfcfd] focus:tw-bg-white focus:tw-border-primary focus:tw-ring-4 focus:tw-ring-primary/15 tw-outline-none tw-transition"
              minLength={8}
              placeholder="........"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="tw-w-full tw-h-[52px] tw-rounded-xl tw-bg-primary hover:tw-bg-primary-dark tw-text-white tw-font-semibold tw-tracking-[0.14em] tw-uppercase tw-transition tw-shadow-[0_10px_30px_rgba(91,22,163,0.35)] hover:tw--translate-y-[1px] disabled:tw-opacity-70 disabled:tw-transform-none"
        >
          {loading ? 'Saving...' : 'Set Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
