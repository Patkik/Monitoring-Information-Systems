import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthLayout from './AuthLayout.jsx';
import { resetPassword, mapErrorCodeToMessage } from '../services/api.js';
import FormInput from '../components/FormInput.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SubmitButton from '../components/SubmitButton.jsx';

export default function ResetPasswordPage() {
	const { token } = useParams();
	const navigate = useNavigate();
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleChange = (e) => {
		setPassword(e.target.value);
	};

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
			<header className="tw-mb-6">
				<p className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-primary">Reset Password</p>
				<h2 className="login-redesign__form-title tw-mt-2 tw-leading-[1.1] tw-text-[#1d2931]">
					Almost
					<br />
					there.
				</h2>
			</header>

			<form onSubmit={onSubmit} className="tw-space-y-3">
				{error && <ErrorAlert message={error} type="error" />}
				
				<FormInput
					label="New Password"
					name="password"
					type="password"
					value={password}
					onChange={handleChange}
					placeholder="Enter new password"
					icon={(props) => (
						<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					)}
					required
				/>

				<SubmitButton loading={loading} text="Verify" />
			</form>
		</AuthLayout>
	);
}



