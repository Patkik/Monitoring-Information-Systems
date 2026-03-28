import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { forgotPassword, verifyCode, verifyResetCode, mapErrorCodeToMessage } from '../services/api.js';
import RecaptchaField from '../../../components/common/RecaptchaField.jsx';

export default function ForgotPasswordPage() {
	const navigate = useNavigate();
	const [step, setStep] = useState(1); // Step 1: email, Step 2: verify code, Step 3: password
	const [email, setEmail] = useState('');
	const [code, setCode] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [recaptchaToken, setRecaptchaToken] = useState('');
	const [recaptchaError, setRecaptchaError] = useState('');
	const recaptchaRef = useRef(null);

	const handleSubmitEmail = async (e) => {
		e.preventDefault();
		setError('');
		setMessage('');
		setRecaptchaError('');

		if (!recaptchaToken) {
			setRecaptchaError('Please complete the verification step.');
			return;
		}

		setLoading(true);
		try {
			await forgotPassword({ email, recaptchaToken });
			setMessage('A reset code has been sent to your email. Check your inbox!');
			setStep(2);
		} catch (err) {
			const errorCode = err?.response?.data?.error;
			setError(mapErrorCodeToMessage(errorCode));
		} finally {
			setLoading(false);
			if (recaptchaRef.current) {
				recaptchaRef.current.reset();
			}
			setRecaptchaToken('');
		}
	};

	const handleVerifyCode = async (e) => {
		e.preventDefault();
		setError('');
		setMessage('');

		if (!code.trim()) {
			setError('Please enter the code from your email.');
			return;
		}

		setLoading(true);
		try {
			await verifyCode({ email, code });
			setMessage('Code verified successfully! Now create your new password.');
			setStep(3);
		} catch (err) {
			const errorCode = err?.response?.data?.error;
			const errorMessage = err?.response?.data?.message || 'Invalid or expired code. Please try again.';
			setError(mapErrorCodeToMessage(errorCode) || errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleResetPassword = async (e) => {
		e.preventDefault();
		setError('');
		setMessage('');

		if (password !== confirmPassword) {
			setError('Passwords do not match.');
			return;
		}

		if (password.length < 8) {
			setError('Password must be at least 8 characters long.');
			return;
		}

		setLoading(true);
		try {
			await verifyResetCode({ email, code, password });
			setMessage('Password reset successfully! Redirecting to login...');
			setTimeout(() => navigate('/login'), 2000);
		} catch (err) {
			const errorMessage = err?.response?.data?.message || err.message || 'Failed to reset password. Please try again.';
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthLayout title="RESET PASSWORD" subtitle="Enter the code sent to your email to create a new password.">
			<form onSubmit={step === 1 ? handleSubmitEmail : handleResetPassword} className="tw-space-y-4">
				{message && (
					<div className="tw-p-3 tw-rounded tw-bg-green-50 tw-text-green-700 tw-text-sm">
						{message}
					</div>
				)}
				{error && (
					<div className="tw-p-3 tw-rounded tw-bg-red-50 tw-text-red-700 tw-text-sm">
						{error}
					</div>
				)}

				{/* STEP 1: Email Input */}
				{step === 1 && (
					<>
						<div className="tw-relative">
							<div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
								<svg
									className="tw-h-5 tw-w-5 tw-text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email"
								className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
								required
							/>
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
							{recaptchaError && (
								<p className="tw-mt-2 tw-text-xs tw-text-red-600">{recaptchaError}</p>
							)}
						</div>

						<button
							disabled={loading}
							onClick={handleSubmitEmail}
							className="tw-px-6 tw-py-3 tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-xl tw-w-full tw-font-semibold tw-transition-colors disabled:tw-opacity-70"
						>
							{loading ? 'Sending Code...' : 'Send Code to Email'}
						</button>
					</>
				)}

				{/* STEP 2: Verify Code */}
				{step === 2 && (
					<>
						<div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3 tw-text-sm tw-text-blue-700 tw-mb-4">
							Check your email for the 6-character code. It may take a few seconds to arrive.
						</div>

						<div className="tw-relative">
							<div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
								<svg
									className="tw-h-5 tw-w-5 tw-text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<input
								type="text"
								value={code}
								onChange={(e) => setCode(e.target.value.toUpperCase())}
								placeholder="Enter the code from your email"
								className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
								maxLength="6"
								required
							/>
						</div>

						<button
							disabled={loading}
							onClick={handleVerifyCode}
							className="tw-px-6 tw-py-3 tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-xl tw-w-full tw-font-semibold tw-transition-colors disabled:tw-opacity-70"
						>
							{loading ? 'Verifying Code...' : 'Verify Code'}
						</button>

						<button
							type="button"
							onClick={() => {
								setStep(1);
								setCode('');
								setMessage('');
								setError('');
							}}
							className="tw-text-center tw-text-sm tw-text-purple-600 hover:tw-text-purple-700 tw-w-full tw-py-2"
						>
							Back to email entry
						</button>
					</>
				)}

				{/* STEP 3: Create New Password */}
				{step === 3 && (
					<>
						<div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-3 tw-text-sm tw-text-green-700 tw-mb-4">
							✓ Code verified! Now create your new password.
						</div>

						<div className="tw-relative">
							<div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
								<svg
									className="tw-h-5 tw-w-5 tw-text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="New password"
								className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
								required
							/>
						</div>

						<div className="tw-relative">
							<div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
								<svg
									className="tw-h-5 tw-w-5 tw-text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<input
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm password"
								className="tw-w-full tw-pl-10 tw-pr-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
								required
							/>
						</div>

						<button
							disabled={loading}
							onClick={handleResetPassword}
							className="tw-px-6 tw-py-3 tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-rounded-xl tw-w-full tw-font-semibold tw-transition-colors disabled:tw-opacity-70"
						>
							{loading ? 'Resetting Password...' : 'Reset Password'}
						</button>

						<button
							type="button"
							onClick={() => {
								setStep(2);
								setPassword('');
								setConfirmPassword('');
								setMessage('');
								setError('');
							}}
							className="tw-text-center tw-text-sm tw-text-purple-600 hover:tw-text-purple-700 tw-w-full tw-py-2"
						>
							Back to code entry
						</button>
					</>
				)}
			</form>
		</AuthLayout>
	);
}


