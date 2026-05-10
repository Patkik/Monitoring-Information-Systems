import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { register, googleOAuthUrl, facebookOAuthUrl, mapErrorCodeToMessage } from '../services/api.js';
import RecaptchaField from '../../../components/common/RecaptchaField.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import FormInput from '../components/FormInput.jsx';
import { useAuthForm } from '../hooks/useAuthForm.js';
import { useRecaptcha } from '../hooks/useRecaptcha.js';
import { validateEmailDomain, getEmailDomainError } from '../utils/validation.js';

const ROLE_OPTIONS = [
	{
		id: 'mentee',
		label: 'Mentee',
		description: 'Request guidance from mentors and follow curated learning tracks.'
	},
	{
		id: 'mentor',
		label: 'Mentor',
		description: 'Coach mentees, share expertise, and manage session plans.'
	}
];

const UserIcon = () => (
	<svg className="tw-h-4 tw-w-4 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
	</svg>
);

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

export default function RegisterPage() {
	const [searchParams] = useSearchParams();
	const initialRoleParam = searchParams.get('role');
	const isValidRole = ROLE_OPTIONS.some((option) => option.id === initialRoleParam);
	const initialRole = isValidRole ? initialRoleParam : 'mentee';

	const [role, setRole] = useState(initialRole);
	const form = useAuthForm({ firstname: '', lastname: '', email: '', password: '', agree: false });
	const recaptcha = useRecaptcha();

	const onSubmit = async (e) => {
		e.preventDefault();
		form.setError('');

		if (!validateEmailDomain(form.form.email)) {
			form.setError(getEmailDomainError());
			return;
		}

		if (!recaptcha.isValid()) {
			form.setError('Please complete the reCAPTCHA');
			return;
		}

		form.setLoading(true);

		try {
			const res = await register({
				firstname: form.form.firstname,
				lastname: form.form.lastname,
				email: form.form.email,
				password: form.form.password,
				role,
				recaptchaToken: recaptcha.getToken()
			});
			const token = res.token;
			localStorage.setItem('token', token);
			const normalizedRole = (res.role || res.user?.role || '').toLowerCase();
			const accountStatus = res.user?.accountStatus || 'active';
			const sanitizedUser = { ...res.user, role: normalizedRole || null, accountStatus };
			localStorage.setItem('user', JSON.stringify(sanitizedUser));
			localStorage.setItem('accountStatus', accountStatus);

			if (!normalizedRole) {
				window.location.href = '/role-selection';
				return;
			}
			if (normalizedRole === 'mentor') {
				window.location.href = '/mentor/application';
			} else if (normalizedRole === 'mentee') {
				window.location.href = '/mentee/application';
			} else {
				window.location.href = '/';
			}
		} catch (err) {
			form.setError(mapErrorCodeToMessage(err?.response?.data?.error));
			recaptcha.resetRecaptcha();
		} finally {
			form.setLoading(false);
		}
	};

	return (
		<AuthLayout title="Create an account" subtitle="Join our mentoring community">
			<form onSubmit={onSubmit} className="tw-space-y-3 sm:tw-space-y-4">
				<ErrorAlert error={form.error} />

				{/* Role Selection */}
				<div>
					<label className="tw-block tw-mb-2 tw-text-[9px] tw-font-semibold tw-tracking-[0.12em] tw-uppercase tw-text-slate-500 dark:tw-text-slate-400">Select Role</label>
					<div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-2">
						{ROLE_OPTIONS.map(option => (
							<label key={option.id} className={`tw-relative tw-flex tw-items-start tw-p-3 tw-border tw-rounded-lg tw-cursor-pointer tw-transition ${
								role === option.id ? 'tw-border-primary tw-bg-primary/5 dark:tw-bg-primary/20' : 'tw-border-gray-200 dark:tw-border-white/10 tw-bg-gray-50 dark:tw-bg-white/5 hover:tw-bg-gray-100 dark:hover:tw-bg-white/10'
							}`}>
								<input
									type="radio"
									name="role"
									value={option.id}
									checked={role === option.id}
									onChange={(e) => setRole(e.target.value)}
									className="tw-sr-only"
								/>
								<div className="tw-ml-2">
									<p className="tw-font-medium tw-text-sm tw-text-gray-900 dark:tw-text-white">{option.label}</p>
									<p className="tw-text-xs tw-text-slate-600 dark:tw-text-slate-400">{option.description}</p>
								</div>
							</label>
						))}
					</div>
				</div>

				{/* Name Fields */}
				<div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3">
					<FormInput
						id="register-firstname"
						name="firstname"
						label="First Name"
						placeholder="Firstname"
						value={form.form.firstname}
						onChange={form.handleChange}
						icon={UserIcon}
						required
					/>
					<FormInput
						id="register-lastname"
						name="lastname"
						label="Last Name"
						placeholder="Lastname"
						value={form.form.lastname}
						onChange={form.handleChange}
						icon={UserIcon}
						required
					/>
				</div>

				{/* Email Input */}
				<FormInput
					id="register-email"
					name="email"
					type="email"
					label="Email"
					placeholder="Email"
					value={form.form.email}
					onChange={form.handleChange}
					icon={EmailIcon}
					required
				/>

				{/* Password Input */}
				<FormInput
					id="register-password"
					name="password"
					type="password"
					label="Password"
					placeholder="Password"
					value={form.form.password}
					onChange={form.handleChange}
					icon={PasswordIcon}
					required
				/>

				{/* Terms & Conditions Checkbox */}
				<label className="tw-flex tw-items-start tw-cursor-pointer tw-gap-2">
					<input
						type="checkbox"
						name="agree"
						checked={form.form.agree}
						onChange={form.handleChange}
						required
						className="tw-mt-1 tw-rounded"
						aria-label="I agree to the terms and conditions"
					/>
					<span className="tw-text-xs tw-text-slate-600 dark:tw-text-slate-400">
						I agree to the <Link to="/terms" className="tw-text-primary dark:tw-text-purple-400 tw-underline hover:tw-text-primary/80 dark:hover:tw-text-purple-300">terms and conditions</Link>
					</span>
				</label>

				{/* reCAPTCHA Field */}
				<RecaptchaField ref={recaptcha.ref} onChange={recaptcha.handleRecaptchaChange} />

				{/* Submit Button */}
				<SubmitButton loading={form.loading} loadingText="Creating account...">
					Create account
				</SubmitButton>

				{/* Social Login Divider */}
				<div className="tw-flex tw-items-center tw-gap-2 tw-my-3">
					<div className="tw-flex-1 tw-h-px tw-bg-gray-200 dark:tw-bg-white/10" />
					<span className="tw-text-[9px] tw-font-semibold tw-tracking-[0.12em] tw-uppercase tw-text-slate-400">or continue with</span>
					<div className="tw-flex-1 tw-h-px tw-bg-gray-200 dark:tw-bg-white/10" />
				</div>

				<a href={googleOAuthUrl()} className="tw-w-full tw-h-9 tw-border tw-border-gray-200 dark:tw-border-white/10 tw-rounded-lg tw-bg-white dark:tw-bg-[#151226] hover:tw-bg-gray-50 dark:hover:tw-bg-white/5 tw-text-gray-900 dark:tw-text-white tw-transition tw-text-sm tw-font-medium tw-flex tw-items-center tw-justify-center tw-gap-2">
					<svg className="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
					Google
				</a>

				<a href={facebookOAuthUrl()} className="tw-w-full tw-h-9 tw-border tw-border-gray-200 dark:tw-border-white/10 tw-rounded-lg tw-bg-[#1877f2] hover:tw-bg-[#1566ce] tw-text-white tw-transition tw-text-sm tw-font-medium tw-flex tw-items-center tw-justify-center tw-gap-2">
					<svg className="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M22 12.07C22 6.49 17.52 2 11.93 2 6.35 2 1.86 6.49 1.86 12.07c0 4.93 3.6 9.03 8.31 9.93v-7.03H7.9v-2.9h2.27V9.41c0-2.25 1.34-3.5 3.4-3.5.99 0 2.02.18 2.02.18v2.24h-1.14c-1.12 0-1.47.69-1.47 1.4v1.68h2.5l-.4 2.9h-2.1V22c4.71-.9 8.31-5 8.31-9.93Z"/>
					</svg>
					Facebook
				</a>

				{/* Sign In Link */}
				<p className="tw-text-center tw-text-xs tw-text-slate-600 dark:tw-text-slate-400">
					Already have an account? <Link to="/login" className="tw-text-primary dark:tw-text-purple-400 tw-underline hover:tw-text-primary/80 dark:hover:tw-text-purple-300">Sign in</Link>
				</p>
			</form>
		</AuthLayout>
	);
}
