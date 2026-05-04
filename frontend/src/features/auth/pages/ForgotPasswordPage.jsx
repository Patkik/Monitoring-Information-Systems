import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthLayout from './AuthLayout.jsx';
import { forgotPassword, verifyCode, verifyResetCode, mapErrorCodeToMessage } from '../services/api.js';
import FormInput from '../components/FormInput.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import RecaptchaField from '../../../components/common/RecaptchaField.jsx';
import { useRecaptcha } from '../hooks/useRecaptcha.js';

export default function ForgotPasswordPage() {
	const navigate = useNavigate();
	const [step, setStep] = useState(1); // Step 1: email, Step 2: verify code, Step 3: password
	const [formData, setFormData] = useState({ email: '', code: '', password: '', confirmPassword: '' });
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { ref: recaptchaRef, token: recaptchaToken, handleRecaptchaChange, resetRecaptcha } = useRecaptcha();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: name === 'code' ? value.toUpperCase() : value }));
	};

	const handleSubmitEmail = async (e) => {
		e.preventDefault();
		setError('');
		setMessage('');

		if (!recaptchaToken) {
			setError('Please complete the reCAPTCHA verification.');
			return;
		}

		setLoading(true);
		try {
			await forgotPassword({ email: formData.email, recaptchaToken });
			setMessage('A reset code has been sent to your email. Check your inbox!');
			setStep(2);
		} catch (err) {
			const errorCode = err?.response?.data?.error;
			setError(mapErrorCodeToMessage(errorCode));
		} finally {
			setLoading(false);
			resetRecaptcha();
		}
	};

	const handleVerifyCode = async (e) => {
		e.preventDefault();
		setError('');
		setMessage('');

		try {
			await verifyCode({ email: formData.email, code: formData.code });
			setMessage('Code verified! Now create your new password.');
			setStep(3);
		} catch (err) {
			const errorCode = err?.response?.data?.error;
			setError(mapErrorCodeToMessage(errorCode));
		}
	};

	const handleResetPassword = async (e) => {
		e.preventDefault();
		setError('');
		setMessage('');

		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		setLoading(true);
		try {
			await verifyResetCode({ email: formData.email, code: formData.code, password: formData.password });
			setMessage('Password reset successfully! Redirecting to login...');
			setTimeout(() => navigate('/login'), 1500);
		} catch (err) {
			const errorCode = err?.response?.data?.error;
			setError(mapErrorCodeToMessage(errorCode));
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthLayout title="Reset Your Password" subtitle="We'll help you regain access to your account">
			<div className="tw-space-y-3">
				{/* Error Messages */}
				{error && <ErrorAlert message={error} type="error" />}

				{/* Success Messages */}
				{message && <ErrorAlert message={message} type="success" />}

				{/* STEP 1: Enter Email */}
				{step === 1 && (
					<form onSubmit={handleSubmitEmail} className="tw-space-y-3">
						<FormInput
							label="Email Address"
							name="email"
							type="email"
							value={formData.email}
							onChange={handleChange}
							placeholder="Enter your email"
							icon={(props) => (
								<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
							)}
							required
						/>

						<RecaptchaField ref={recaptchaRef} onChange={handleRecaptchaChange} />

						<SubmitButton loading={loading} text="Send Reset Code" />
					</form>
				)}

				{/* STEP 2: Verify Code */}
				{step === 2 && (
					<>
						<form onSubmit={handleVerifyCode} className="tw-space-y-3">
							<FormInput
								label="Verification Code"
								name="code"
								type="text"
								value={formData.code}
								onChange={handleChange}
								placeholder="Enter the code from your email"
								maxLength="6"
								icon={(props) => (
									<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								)}
								required
							/>

							<SubmitButton loading={loading} text="Verify Code" />
						</form>

						<button
							type="button"
							onClick={() => {
								setStep(1);
								setFormData((prev) => ({ ...prev, code: '' }));
								setMessage('');
								setError('');
							}}
							className="tw-text-center tw-text-xs tw-text-primary tw-underline hover:tw-text-primary/80 tw-w-full tw-py-1.5"
						>
							Back to email entry
						</button>
					</>
				)}

				{/* STEP 3: Create New Password */}
				{step === 3 && (
					<>
						<form onSubmit={handleResetPassword} className="tw-space-y-3">
							<FormInput
								label="New Password"
								name="password"
								type="password"
								value={formData.password}
								onChange={handleChange}
								placeholder="Create a new password"
								icon={(props) => (
									<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								)}
								required
							/>

							<FormInput
								label="Confirm Password"
								name="confirmPassword"
								type="password"
								value={formData.confirmPassword}
								onChange={handleChange}
								placeholder="Confirm your new password"
								icon={(props) => (
									<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								)}
								required
							/>

							<SubmitButton loading={loading} text="Reset Password" />
						</form>

						<button
							type="button"
							onClick={() => navigate('/login')}
							className="tw-text-center tw-text-xs tw-text-primary tw-underline hover:tw-text-primary/80 tw-w-full tw-py-1.5"
						>
							Back to login
						</button>
					</>
				)}
			</div>
		</AuthLayout>
	);
}

