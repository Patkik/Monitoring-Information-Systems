import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { mapErrorCodeToMessage, sendVerificationCode, verifyEmail } from '../services/api.js';

const RESEND_COOLDOWN_SECONDS = 30;
const SUCCESS_REDIRECT_DELAY_MS = 1500;

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialEmail = searchParams.get('email') || '';
  const role = (searchParams.get('role') || 'mentor').toLowerCase();

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const redirectTimerRef = useRef(null);

  const canResend = useMemo(() => cooldown <= 0 && !resending, [cooldown, resending]);

  useEffect(() => {
    if (!email) {
      return;
    }

    let cancelled = false;

    const bootstrapSendCode = async () => {
      try {
        setResending(true);
        await sendVerificationCode({ email });
        if (!cancelled) {
          setSuccess('Verification code sent. Please check your inbox.');
          setCooldown(RESEND_COOLDOWN_SECONDS);
        }
      } catch (err) {
        if (!cancelled) {
          const codeFromApi = err?.response?.data?.error;
          setError(mapErrorCodeToMessage(codeFromApi));
        }
      } finally {
        if (!cancelled) {
          setResending(false);
        }
      }
    };

    bootstrapSendCode();

    return () => {
      cancelled = true;
    };
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!normalizedEmail || !normalizedCode) {
      setError('Email and verification code are required.');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyEmail({ email: normalizedEmail, code: normalizedCode });

      if (result?.token && result?.user) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
      }

      setSuccess('Verification succeeds. Redirecting...');
      redirectTimerRef.current = window.setTimeout(() => {
        if (role === 'mentor') {
          navigate('/mentor/application');
          return;
        }
        navigate('/login');
      }, SUCCESS_REDIRECT_DELAY_MS);
    } catch (err) {
      const codeFromApi = err?.response?.data?.error;
      setError(mapErrorCodeToMessage(codeFromApi));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Email is required.');
      return;
    }

    setResending(true);
    try {
      await sendVerificationCode({ email: normalizedEmail });
      setSuccess('New verification code sent successfully.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const codeFromApi = err?.response?.data?.error;
      setError(mapErrorCodeToMessage(codeFromApi));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout title="Verify Your Email" subtitle="Enter the 6-digit code sent to your email to continue.">
      <form onSubmit={handleVerify} className="tw-space-y-4">
        {error ? <div className="tw-p-3 tw-rounded tw-bg-red-50 tw-text-red-700 tw-text-sm">{error}</div> : null}
        {success ? <div className="tw-p-3 tw-rounded tw-bg-green-50 tw-text-green-700 tw-text-sm">{success}</div> : null}

        <div className="tw-space-y-2">
          <label className="tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="verify-email-input">Email</label>
          <input
            id="verify-email-input"
            className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
        </div>

        <div className="tw-space-y-2">
          <label className="tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="verify-code-input">Verification code</label>
          <input
            id="verify-code-input"
            className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors tw-tracking-[0.2em] tw-text-center tw-font-semibold"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </div>

        <button
          disabled={loading}
          className="tw-w-full tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-xl tw-py-3 tw-font-semibold tw-transition-colors disabled:tw-opacity-70"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend}
          className="tw-w-full tw-border tw-border-gray-300 hover:tw-border-gray-400 tw-rounded-xl tw-py-3 tw-font-medium tw-transition-colors disabled:tw-opacity-60"
        >
          {resending
            ? 'Sending...'
            : cooldown > 0
              ? `Resend Code (${cooldown}s)`
              : 'Resend Code'}
        </button>

        <p className="tw-text-sm tw-text-center tw-text-gray-600">
          Back to <Link to="/login" className="tw-text-purple-600 hover:tw-text-purple-700 tw-font-semibold">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
