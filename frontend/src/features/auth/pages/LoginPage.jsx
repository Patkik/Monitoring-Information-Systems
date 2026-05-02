import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { login, googleOAuthUrl, facebookOAuthUrl, mapErrorCodeToMessage } from '../services/api.js';
import RecaptchaField from '../../../components/common/RecaptchaField.jsx';
import { dispatchAccountDeactivated } from '../../../shared/constants/accountStatus';
import itcsLogo from './itcs-logo.png';
import './login-redesign.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  const recaptchaRef = useRef(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRecaptchaError('');
    if (!recaptchaToken) {
      setRecaptchaError('Please complete the verification step.');
      return;
    }
    setLoading(true);
    try {
      const res = await login({ ...form, recaptchaToken });
      const token = res.token;
      localStorage.setItem('token', token);

      const normalizedRole = (res.role || res.user?.role || '').toLowerCase();
      const accountStatus = res.user?.accountStatus || 'active';
      const sanitizedUser = {
        ...res.user,
        role: normalizedRole || null,
        accountStatus
      };
      localStorage.setItem('user', JSON.stringify(sanitizedUser));
      localStorage.setItem('accountStatus', accountStatus);
      
      const applicationStatus = res.user?.applicationStatus || 'not_submitted';
      
      // Check if user has selected a role
      if (!normalizedRole) {
        // User hasn't selected a role yet, redirect to role selection
        window.location.href = '/role-selection';
        return;
      }
      
      // Redirect based on role and application status
      if (normalizedRole === 'admin') {
        window.location.href = '/admin/dashboard';
      } else if (normalizedRole === 'mentor') {
        if (applicationStatus === 'not_submitted' || !applicationStatus) {
          window.location.href = '/mentor/application';
        } else if (applicationStatus === 'pending') {
          window.location.href = '/mentor/pending';
        } else if (applicationStatus === 'approved') {
          window.location.href = '/mentor/dashboard';
        } else {
          window.location.href = '/mentor/application';
        }
      } else if (normalizedRole === 'mentee') {
        // Handle mentee application flow
        if (applicationStatus === 'not_submitted' || !applicationStatus) {
          window.location.href = '/mentee/application';
        } else if (applicationStatus === 'pending') {
          window.location.href = '/mentee/pending';
        } else if (applicationStatus === 'approved') {
          window.location.href = '/mentee/dashboard';
        } else {
          // Default to application form for rejected or unknown status
          window.location.href = '/mentee/application';
        }
      }
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === 'ACCOUNT_DEACTIVATED') {
        dispatchAccountDeactivated(err?.response?.data?.message);
      }
      setError(mapErrorCodeToMessage(code));
    } finally {
      setLoading(false);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken('');
    }
  };

  return (
    <div className="login-redesign tw-min-h-screen tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-bg-[#f7f8fa] tw-text-slate-900">
      <aside className="tw-hidden md:tw-flex tw-relative tw-overflow-hidden tw-flex-col tw-justify-between tw-p-10 lg:tw-p-12">
        <div className="login-redesign__mesh" aria-hidden="true" />
        <div className="login-redesign__grit" aria-hidden="true" />
        <div className="login-redesign__orbit" aria-hidden="true" />
        <div className="login-redesign__diamonds" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="tw-relative tw-z-10 tw-flex tw-items-center tw-gap-3 tw-animate-[fadeUp_.8s_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="tw-relative tw-h-14 tw-w-14 tw-rounded-full tw-bg-white/15 tw-backdrop-blur-md tw-ring-1 tw-ring-white/40 tw-flex tw-items-center tw-justify-center tw-overflow-hidden login-redesign__badge-ring">
            <img
              src={itcsLogo}
              alt="Information Technology Computer Society logo"
              className="tw-w-[72%] tw-h-[72%] tw-object-contain tw-drop-shadow-md login-redesign__badge-logo"
              loading="eager"
              decoding="async"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/logo.svg';
              }}
            />
          </div>
          <div>
            <p className="tw-text-[11px] tw-uppercase tw-tracking-[0.24em] tw-text-cyan-100/80">ITCS Portal</p>
            <p className="tw-text-xs tw-tracking-[0.08em] tw-uppercase tw-text-white/70">Activate Project Access</p>
          </div>
        </div>

        <div className="tw-relative tw-z-10 tw-max-w-[32rem] tw-space-y-5">
          <p className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.24em] tw-text-cyan-100/85">Student Access</p>
          <h1 className="login-redesign__hero-title tw-leading-[0.95] tw-text-white">
            Sign in and
            <br />
            continue your momentum.
          </h1>
          <p className="tw-max-w-[30ch] tw-text-sm tw-leading-7 tw-text-cyan-50/70">
            Mentoring, progress tracking, and guided learning are waiting on the other side.
          </p>
          <div className="tw-h-[2px] tw-w-14 tw-bg-gradient-to-r tw-from-cyan-300 tw-to-transparent" />
          <div className="tw-flex tw-gap-8 tw-pt-3">
            <div>
              <p className="tw-text-3xl tw-font-semibold tw-text-white">12k+</p>
              <p className="tw-mt-1 tw-text-[10px] tw-tracking-[0.14em] tw-uppercase tw-text-cyan-100/70">Students</p>
            </div>
            <div>
              <p className="tw-text-3xl tw-font-semibold tw-text-white">340+</p>
              <p className="tw-mt-1 tw-text-[10px] tw-tracking-[0.14em] tw-uppercase tw-text-cyan-100/70">Courses</p>
            </div>
            <div>
              <p className="tw-text-3xl tw-font-semibold tw-text-white">98%</p>
              <p className="tw-mt-1 tw-text-[10px] tw-tracking-[0.14em] tw-uppercase tw-text-cyan-100/70">Satisfaction</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="tw-relative tw-flex tw-items-center tw-justify-center tw-p-6 md:tw-p-10 lg:tw-p-14 tw-bg-[#fffdf9]">
        <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-h-[3px] tw-bg-gradient-to-r tw-from-[#194a57] tw-via-[#2ea8c6] tw-to-transparent" aria-hidden="true" />

        <div className="tw-w-full tw-max-w-xl tw-rounded-3xl tw-bg-white/90 tw-backdrop-blur-sm tw-border tw-border-[#e7e1d6] tw-shadow-[0_24px_80px_rgba(22,38,48,0.12)] tw-p-6 sm:tw-p-8 md:tw-p-10">
          <Link
            to="/"
            className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-slate-500 hover:tw-text-[#1b6275] tw-transition-colors"
          >
            <span aria-hidden="true">&larr;</span>
            Return to landing page
          </Link>

          <header className="tw-mt-8 tw-mb-8">
            <p className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-[#1f7f96]">Sign in</p>
            <h2 className="login-redesign__form-title tw-mt-2 tw-leading-[1.02] tw-text-[#1d2931]">
              Your journey
              <br />
              keeps moving.
            </h2>
          </header>

          <form onSubmit={onSubmit} className="tw-space-y-4">
            {error && <div className="tw-p-3 tw-rounded-xl tw-bg-red-50 tw-text-red-700 tw-text-sm tw-border tw-border-red-100">{error}</div>}

            <div className="tw-relative">
              <label className="tw-block tw-mb-2 tw-text-[11px] tw-font-semibold tw-tracking-[0.14em] tw-uppercase tw-text-slate-500" htmlFor="login-email">
                Email or Username
              </label>
              <div className="tw-relative">
                <svg className="tw-absolute tw-h-4 tw-w-4 tw-left-4 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="you@example.com"
                  className="tw-w-full tw-h-12 tw-pl-11 tw-pr-4 tw-rounded-xl tw-border tw-border-[#d7dbe1] tw-bg-[#fbfcfd] focus:tw-bg-white focus:tw-border-[#2ea8c6] focus:tw-ring-4 focus:tw-ring-[#2ea8c6]/15 tw-outline-none tw-transition"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="tw-relative">
              <label className="tw-block tw-mb-2 tw-text-[11px] tw-font-semibold tw-tracking-[0.14em] tw-uppercase tw-text-slate-500" htmlFor="login-password">
                Password
              </label>
              <div className="tw-relative">
                <svg className="tw-absolute tw-h-4 tw-w-4 tw-left-4 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="........"
                  className="tw-w-full tw-h-12 tw-pl-11 tw-pr-4 tw-rounded-xl tw-border tw-border-[#d7dbe1] tw-bg-[#fbfcfd] focus:tw-bg-white focus:tw-border-[#2ea8c6] focus:tw-ring-4 focus:tw-ring-[#2ea8c6]/15 tw-outline-none tw-transition"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <div className="tw-flex tw-items-center tw-justify-end tw-text-sm">
              <Link to="/forgot-password" className="tw-text-[#1f7f96] hover:tw-text-[#145466] tw-font-semibold tw-transition-colors">
                Forgot password?
              </Link>
            </div>

            <div>
              <RecaptchaField
                ref={recaptchaRef}
                onChange={(token) => {
                  setRecaptchaToken(token || '');
                  if (token) {
                    setRecaptchaError('');
                  }
                }}
                onExpired={() => {
                  setRecaptchaToken('');
                  setRecaptchaError('Verification expired, please try again.');
                }}
              />
              {recaptchaError && <p className="tw-mt-2 tw-text-xs tw-text-red-600">{recaptchaError}</p>}
            </div>

            <button
              disabled={loading}
              className="tw-w-full tw-h-[52px] tw-rounded-xl tw-bg-[#155f73] hover:tw-bg-[#104d5d] tw-text-white tw-font-semibold tw-tracking-[0.14em] tw-uppercase tw-transition tw-shadow-[0_10px_30px_rgba(21,95,115,0.35)] hover:tw--translate-y-[1px] disabled:tw-opacity-70 disabled:tw-transform-none"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>

            <div className="tw-flex tw-items-center tw-gap-3 tw-my-5">
              <div className="tw-flex-1 tw-h-px tw-bg-[#e6e9ec]" />
              <span className="tw-text-[11px] tw-font-semibold tw-tracking-[0.15em] tw-uppercase tw-text-slate-400">or continue with</span>
              <div className="tw-flex-1 tw-h-px tw-bg-[#e6e9ec]" />
            </div>

            <button
              type="button"
              onClick={() => (window.location.href = googleOAuthUrl())}
              className="tw-w-full tw-h-[50px] tw-border tw-border-[#d7dbe1] hover:tw-border-[#b9c4ce] tw-rounded-xl tw-bg-white hover:tw-bg-[#f8fafc] tw-font-semibold tw-transition tw-flex tw-items-center tw-justify-center tw-gap-3"
            >
              <svg className="tw-w-5 tw-h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = facebookOAuthUrl())}
              className="tw-w-full tw-h-[50px] tw-rounded-xl tw-bg-[#1877f2] hover:tw-bg-[#1566ce] tw-text-white tw-font-semibold tw-transition tw-flex tw-items-center tw-justify-center tw-gap-3"
            >
              <svg className="tw-w-5 tw-h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 12.07C22 6.49 17.52 2 11.93 2 6.35 2 1.86 6.49 1.86 12.07c0 4.93 3.6 9.03 8.31 9.93v-7.03H7.9v-2.9h2.27V9.41c0-2.25 1.34-3.5 3.4-3.5.99 0 2.02.18 2.02.18v2.24h-1.14c-1.12 0-1.47.69-1.47 1.4v1.68h2.5l-.4 2.9h-2.1V22c4.71-.9 8.31-5 8.31-9.93Z" />
              </svg>
              <span>Continue with Facebook</span>
            </button>

            <p className="tw-text-sm tw-text-center tw-text-slate-500 tw-pt-2">
              Do not have an account?{' '}
              <Link to="/register" className="tw-text-[#1f7f96] hover:tw-text-[#145466] tw-font-semibold">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}


