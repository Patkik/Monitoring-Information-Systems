import React, { useState } from 'react';
import logger from '../shared/utils/logger';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../features/auth/pages/AuthLayout';
import { buildApiUrl } from '../shared/config/apiClient';

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = async (role) => {
    setError('');
    setLoading(true);
    setSelectedRole(role);
    try {
      // Update user role in backend
  const response = await fetch(buildApiUrl('/auth/update-role'), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });

        if (response.ok) {
        const data = await response.json();
        // Update user data in localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...storedUser,
          ...(data?.user || {}),
          role,
          applicationStatus: data?.user?.applicationStatus || 'not_submitted',
          applicationRole: data?.user?.applicationRole || role
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Redirect based on role
        if (role === 'mentee') {
          navigate('/mentee/application');
        } else if (role === 'mentor') {
          navigate('/mentor/application');
        }
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData?.message || 'Failed to update role. Please try again.');
        setSelectedRole('');
      }
    } catch (error) {
      logger.error('Error updating role:', error);
      setError('Unable to update role. Please try again.');
      setSelectedRole('');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: 'mentee',
      title: 'Mentee',
      description: 'Learn with a mentor, follow a guided track, and build portfolio-ready outcomes.',
      icon: '🎓',
      color: 'tw-from-blue-500 tw-to-blue-600',
      hoverColor: 'tw-from-blue-600 tw-to-blue-700'
    },
    {
      id: 'mentor',
      title: 'Mentor',
      description: 'Share your expertise, coach students, and grow leadership skills.',
      icon: '👨‍🏫',
      color: 'tw-from-green-500 tw-to-green-600',
      hoverColor: 'tw-from-green-600 tw-to-green-700'
    },
    // Admin role removed from public selection; admin accounts are provisioned by program owner.
  ];

  return (
    <AuthLayout 
      title="CHOOSE YOUR ROLE" 
      subtitle="Select how you want to participate and we’ll guide you through a quick setup."
    >
      <div className="tw-space-y-8">
        {/* Helpful intro banner */}
        <div className="tw-rounded-xl tw-border tw-border-purple-200 tw-bg-purple-50 tw-p-4">
          <div className="tw-flex tw-items-start tw-gap-3">
            <div className="tw-text-2xl">✨</div>
            <div>
              <p className="tw-text-sm tw-text-gray-700">
                After choosing a role, you’ll complete a short application so we can tailor your experience. It usually
                takes under 2 minutes. You can change roles later in settings.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-text-red-700">
            {error}
          </div>
        )}

        <div className="tw-text-center">
          <p className="tw-text-gray-600 tw-text-lg">
            How would you like to participate in our mentoring program?
          </p>
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              disabled={loading}
              className={`tw-relative tw-p-8 tw-rounded-xl tw-border-2 tw-transition-all tw-duration-200 tw-transform hover:tw-scale-105 tw-disabled:tw-opacity-50 tw-disabled:tw-cursor-not-allowed ${
                selectedRole === role.id
                  ? `tw-border-purple-500 tw-bg-gradient-to-r ${role.color} tw-text-white`
                  : 'tw-border-gray-200 tw-bg-white hover:tw-border-purple-300 tw-text-gray-700'
              }`}
            >
              <div className="tw-text-center tw-space-y-4">
                <div className="tw-text-6xl tw-mb-4">{role.icon}</div>
                <h3 className="tw-text-xl tw-font-bold">{role.title}</h3>
                <p className="tw-text-sm tw-opacity-90">{role.description}</p>
                {selectedRole !== role.id && (
                  <p className="tw-text-xs tw-text-gray-500 tw-opacity-90">
                    Click to continue — you’ll be redirected to a quick application.
                  </p>
                )}
              </div>

              {selectedRole === role.id && (
                <div className="tw-absolute tw-top-4 tw-right-4">
                  <svg className="tw-w-6 tw-h-6 tw-text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="tw-text-center tw-py-4">
            <div className="tw-inline-flex tw-items-center tw-space-x-2">
              <div className="tw-animate-spin tw-rounded-full tw-h-5 tw-w-5 tw-border-b-2 tw-border-purple-500"></div>
              <span className="tw-text-gray-600">Updating your role...</span>
            </div>
          </div>
        )}

        {/* What happens next */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-mt-2">
          {[ 
            { n: '1', t: 'Choose a role', d: 'Pick how you want to use the platform.' },
            { n: '2', t: 'Complete application', d: 'Answer a few quick questions.' },
            { n: '3', t: 'Get approved', d: 'Admins review and approve applications.' },
            { n: '4', t: 'Access dashboard', d: 'Start mentoring or learning with tools.' },
          ].map((s) => (
            <div key={s.n} className="tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4">
              <div className="tw-flex tw-items-center tw-gap-3">
                <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-purple-100 tw-text-purple-700 tw-font-bold tw-flex tw-items-center tw-justify-center">{s.n}</div>
                <div>
                  <p className="tw-text-sm tw-font-semibold tw-text-gray-900">{s.t}</p>
                  <p className="tw-text-xs tw-text-gray-500">{s.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="tw-text-center tw-text-xs tw-text-gray-500">
          <p>We only ask for information needed to personalize your experience and ensure program integrity.</p>
        </div>
      </div>
    </AuthLayout>
  );
}
