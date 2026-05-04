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

<<<<<<< HEAD
			if (role === 'mentor') {
				localStorage.removeItem('token');
				localStorage.removeItem('user');
				navigate(`/verify-email?email=${encodeURIComponent(form.email)}&role=mentor`);
				return;
			}

			// If backend returned token+user, auto-login and navigate into the application flow
			if (result?.token && result?.user) {
				localStorage.setItem('token', result.token);
				localStorage.setItem('user', JSON.stringify(result.user));
			}

			if (role === 'mentee') {
				navigate('/mentee/application');
=======
			if (!normalizedRole) {
				window.location.href = '/role-selection';
				return;
			}
			if (normalizedRole === 'mentor') {
				window.location.href = '/mentor/application';
			} else if (normalizedRole === 'mentee') {
				window.location.href = '/mentee/application';
>>>>>>> rescue-01fad88
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
					<label className="tw-block tw-mb-2 tw-text-[9px] tw-font-semibold tw-tracking-[0.12em] tw-uppercase tw-text-slate-500">Select Role</label>
					<div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-2">
						{ROLE_OPTIONS.map(option => (
							<label key={option.id} className={`tw-relative tw-flex tw-items-start tw-p-3 tw-border tw-rounded-lg tw-cursor-pointer tw-transition ${
								role === option.id ? 'tw-border-primary tw-bg-primary/5' : 'tw-border-gray-200 tw-bg-gray-50'
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
									<p className="tw-font-medium tw-text-sm">{option.label}</p>
									<p className="tw-text-xs tw-text-slate-600">{option.description}</p>
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

				{/* reCAPTCHA Field */}
				<RecaptchaField ref={recaptcha.ref} onChange={recaptcha.handleRecaptchaChange} />

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
					<span className="tw-text-xs tw-text-slate-600">
						I agree to the <Link to="/terms" className="tw-text-primary tw-underline hover:tw-text-primary/80">terms and conditions</Link>
					</span>
				</label>

				{/* Submit Button */}
				<SubmitButton loading={form.loading} loadingText="Creating account...">
					Create account
				</SubmitButton>

				{/* Social Login */}
				<div className="tw-relative tw-my-3 tw-before:tw-absolute tw-before:tw-inset-0 tw-before:tw-border-t tw-before:tw-border-gray-200 tw-flex tw-items-center">
					<span className="tw-relative tw-bg-white tw-px-2 tw-text-xs tw-text-slate-600">Or</span>
				</div>

				<a href={googleOAuthUrl()} className="tw-w-full tw-h-9 tw-border tw-border-gray-200 tw-rounded-lg tw-bg-white hover:tw-bg-gray-50 tw-transition tw-text-sm tw-font-medium tw-flex tw-items-center tw-justify-center tw-gap-2">
					<svg className="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
					Google
				</a>

				<a href={facebookOAuthUrl()} className="tw-w-full tw-h-9 tw-border tw-border-gray-200 tw-rounded-lg tw-bg-white hover:tw-bg-gray-50 tw-transition tw-text-sm tw-font-medium tw-flex tw-items-center tw-justify-center tw-gap-2">
					<svg className="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="#1877F2">
						<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
					</svg>
					Facebook
				</a>

				{/* Sign In Link */}
				<p className="tw-text-center tw-text-xs tw-text-slate-600">
					Already have an account? <Link to="/login" className="tw-text-primary tw-underline hover:tw-text-primary/80">Sign in</Link>
				</p>
			</form>
		</AuthLayout>
	);
}
