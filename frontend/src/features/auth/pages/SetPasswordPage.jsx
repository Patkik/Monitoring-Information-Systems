import React, { useRef, useState } from 'react';
import AuthLayout from './AuthLayout.jsx';
import FormInput from '../components/FormInput.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import { buildApiUrl } from '../../../shared/config/apiClient';

export default function SetPasswordPage() {
	const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);
	const formRef = useRef(null);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		if (formData.password.length < 8) {
			setError('Password must be at least 8 characters.');
			return;
		}
		if (formData.password !== formData.confirmPassword) {
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
				body: JSON.stringify({ password: formData.password }),
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
			<header className="tw-mb-6">
				<p className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-primary">Set Password</p>
				<h2 className="login-redesign__form-title tw-mt-2 tw-leading-[1.1] tw-text-[#1d2931]">
					Secure your
					<br />
					account.
				</h2>
			</header>

			<form ref={formRef} onSubmit={onSubmit} className="tw-space-y-3">
				{error && <ErrorAlert message={error} type="error" />}
				{success && <ErrorAlert message={success} type="success" />}

				<FormInput
					label="New password"
					name="password"
					type="password"
					value={formData.password}
					onChange={handleChange}
					placeholder="........"
					icon={(props) => (
						<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					)}
					minLength={8}
					required
				/>

				<FormInput
					label="Confirm password"
					name="confirmPassword"
					type="password"
					value={formData.confirmPassword}
					onChange={handleChange}
					placeholder="........"
					icon={(props) => (
						<svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					)}
					minLength={8}
					required
				/>

				<SubmitButton loading={loading} text="Set Password" />
			</form>
		</AuthLayout>
	);
}

