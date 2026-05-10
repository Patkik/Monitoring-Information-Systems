import React from 'react';
import { Link } from 'react-router-dom';
import { login, googleOAuthUrl, facebookOAuthUrl, mapErrorCodeToMessage } from '../services/api.js';
import RecaptchaField from '../../../components/common/RecaptchaField.jsx';
import { dispatchAccountDeactivated } from '../../../shared/constants/accountStatus';
import AuthLayout from './AuthLayout.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import FormInput from '../components/FormInput.jsx';
import { useAuthForm } from '../hooks/useAuthForm.js';
import { useRecaptcha } from '../hooks/useRecaptcha.js';

const EmailIcon = () => (
	<svg className="tw-h-4 tw-w-4 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
	</svg>
);

const PasswordIcon = () => (
	<svg className="tw-h-4 tw-w-4 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
	</svg>
);

export default function LoginPage() {
	const form = useAuthForm({ email: '', password: '' });
	const recaptcha = useRecaptcha();

	const onSubmit = async (e) => {
		e.preventDefault();
		form.setError('');

		if (!recaptcha.isValid()) {
			form.setError('Please complete the verification step.');
			return;
		}

		form.setLoading(true);

		try {
			const res = await login({ ...form.form, recaptchaToken: recaptcha.getToken() });
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

			if (!normalizedRole) {
				window.location.href = '/role-selection';
				return;
			}

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
				if (applicationStatus === 'not_submitted' || !applicationStatus) {
					window.location.href = '/mentee/application';
				} else if (applicationStatus === 'pending') {
					window.location.href = '/mentee/pending';
				} else if (applicationStatus === 'approved') {
					window.location.href = '/mentee/dashboard';
				} else {
					window.location.href = '/mentee/application';
				}
			}
		} catch (err) {
			const code = err?.response?.data?.error;
			if (code === 'ACCOUNT_DEACTIVATED') {
				dispatchAccountDeactivated(err?.response?.data?.message);
			}
			form.setError(mapErrorCodeToMessage(code));
			recaptcha.resetRecaptcha();
		} finally {
			form.setLoading(false);
		}
	};

	return (
		<AuthLayout
			title="Sign in and continue your momentum."
			subtitle="Mentoring, progress tracking, and guided learning are waiting on the other side."
		>
			<header className="tw-mb-3">
				<p className="tw-text-[9px] tw-font-semibold tw-uppercase tw-tracking-[0.15em] tw-text-primary">Sign in</p>
				<h2 className="login-redesign__form-title tw-mt-1 tw-leading-[1.1] tw-text-[#1d2931] dark:tw-text-white tw-text-base">
					Your journey
					<br />
					keeps moving.
				</h2>
			</header>

			<form onSubmit={onSubmit} className="tw-space-y-2 sm:tw-space-y-3">
				<ErrorAlert error={form.error} />

				{/* Email Input */}
				<FormInput
					id="login-email"
					name="email"
					type="text"
					label="Email or Username"
					placeholder="you@example.com"
					value={form.form.email}
					onChange={form.handleChange}
					icon={EmailIcon}
					required
					autoComplete="email"
				/>

				{/* Password Input */}
				<FormInput
					id="login-password"
					name="password"
					type="password"
					label="Password"
					placeholder="........"
					value={form.form.password}
					onChange={form.handleChange}
					icon={PasswordIcon}
					required
					autoComplete="current-password"
				/>

				{/* Forgot Password Link */}
				<div className="tw-flex tw-items-center tw-justify-end tw-text-[10px]">
					<Link to="/forgot-password" className="tw-text-primary dark:tw-text-purple-400 hover:tw-text-primary-dark dark:hover:tw-text-purple-300 tw-font-semibold tw-transition-colors">
						Forgot password?
					</Link>
				</div>

				{/* reCAPTCHA Field */}
				<RecaptchaField ref={recaptcha.ref} onChange={recaptcha.handleRecaptchaChange} />

				{/* Submit Button */}
				<SubmitButton loading={form.loading} loadingText="Logging in...">
					Sign In
				</SubmitButton>

				{/* Social Login Divider */}
				<div className="tw-flex tw-items-center tw-gap-2 tw-my-3">
					<div className="tw-flex-1 tw-h-px tw-bg-gray-200 dark:tw-bg-white/10" />
					<span className="tw-text-[9px] tw-font-semibold tw-tracking-[0.12em] tw-uppercase tw-text-slate-400">or continue with</span>
					<div className="tw-flex-1 tw-h-px tw-bg-gray-200 dark:tw-bg-white/10" />
				</div>

				{/* Google Login */}
				<a href={googleOAuthUrl()} className="tw-w-full tw-h-9 tw-border tw-border-gray-200 dark:tw-border-white/10 tw-rounded-lg tw-bg-white dark:tw-bg-[#151226] hover:tw-bg-gray-50 dark:hover:tw-bg-white/5 tw-text-gray-900 dark:tw-text-white tw-text-sm tw-font-semibold tw-transition tw-flex tw-items-center tw-justify-center tw-gap-2">
					<svg className="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
					<span>Google</span>
				</a>

				{/* Facebook Login */}
				<a href={facebookOAuthUrl()} className="tw-w-full tw-h-9 tw-border tw-border-gray-200 dark:tw-border-white/10 tw-rounded-lg tw-bg-[#1877f2] hover:tw-bg-[#1566ce] tw-text-white tw-text-sm tw-font-semibold tw-transition tw-flex tw-items-center tw-justify-center tw-gap-2">
					<svg className="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M22 12.07C22 6.49 17.52 2 11.93 2 6.35 2 1.86 6.49 1.86 12.07c0 4.93 3.6 9.03 8.31 9.93v-7.03H7.9v-2.9h2.27V9.41c0-2.25 1.34-3.5 3.4-3.5.99 0 2.02.18 2.02.18v2.24h-1.14c-1.12 0-1.47.69-1.47 1.4v1.68h2.5l-.4 2.9h-2.1V22c4.71-.9 8.31-5 8.31-9.93Z" />
					</svg>
					<span>Facebook</span>
				</a>

				{/* Sign Up Link */}
				<p className="tw-text-xs tw-text-center tw-text-slate-500 dark:tw-text-slate-400 tw-pt-1">
					Do not have an account?{' '}
					<Link to="/register" className="tw-text-primary dark:tw-text-purple-400 hover:tw-text-primary-dark dark:hover:tw-text-purple-300 tw-font-semibold">
						Create one
					</Link>
				</p>
			</form>
		</AuthLayout>
	);
}
