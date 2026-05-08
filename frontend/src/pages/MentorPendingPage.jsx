import React, { useEffect, useState } from 'react';
import logger from '../shared/utils/logger';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { buildApiUrl } from '../shared/config/apiClient';

export default function MentorPendingPage() {
  const navigate = useNavigate();
  const [applicationStatus, setApplicationStatus] = useState('pending');
  const [applicationData, setApplicationData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkApplicationStatus();
    const interval = setInterval(checkApplicationStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApplicationStatus = async () => {
    try {
  const response = await fetch(buildApiUrl('/mentor/application/status'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplicationStatus(data.status);
        setApplicationData(data.applicationData);
        setProfile(data.profile);

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...storedUser,
          applicationStatus: data.status,
          applicationRole: data.role || storedUser.applicationRole
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        if (data.status === 'approved') {
          navigate('/mentor/dashboard');
        }
      }
    } catch (error) {
      logger.error('Failed to check mentor application status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isRejected = applicationStatus === 'rejected';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="tw-min-h-screen tw-bg-gray-50 tw-flex tw-items-center tw-justify-center">
          <div className="tw-animate-spin tw-rounded-full tw-h-12 tw-w-12 tw-border-b-2 tw-border-purple-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="tw-min-h-screen tw-bg-gray-50 tw-py-8">
        <div className="tw-max-w-2xl tw-mx-auto tw-px-4">
          <div className="tw-flex tw-justify-between tw-items-center tw-mb-8">
            <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Mentor Application Status</h1>
            <button
              onClick={handleLogout}
              className="tw-px-4 tw-py-2 tw-text-purple-600 hover:tw-text-purple-700 tw-font-medium tw-transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-8 tw-text-center">
            <div className="tw-mb-6">
              <div className={`tw-w-24 tw-h-24 tw-mx-auto tw-rounded-full tw-flex tw-items-center tw-justify-center ${
                isRejected ? 'tw-bg-red-100' : 'tw-bg-purple-100'
              }`}>
                <svg
                  className={`tw-w-12 tw-h-12 ${isRejected ? 'tw-text-red-600' : 'tw-text-purple-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isRejected ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
            </div>

            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-4">
              {isRejected ? 'Application Requires Updates' : 'Your Application Is Under Review'}
            </h2>

            <p className="tw-text-lg tw-text-gray-600 tw-mb-6">
              {isRejected
                ? 'Thank you for your interest. Please review the feedback below and update your application to continue.'
                : 'Thank you for volunteering to mentor. Our admin team is reviewing your profile and will notify you once a decision has been made.'}
            </p>

            <div
              className={`tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-rounded-full tw-font-medium tw-mb-8 ${
                isRejected
                  ? 'tw-bg-red-100 tw-text-red-700'
                  : 'tw-bg-yellow-100 tw-text-yellow-800'
              }`}
            >
              <svg className="tw-w-5 tw-h-5 tw-mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              {isRejected ? 'Action Needed' : 'Pending Admin Approval'}
            </div>

            {applicationData && (
              <div className="tw-bg-gray-50 tw-rounded-lg tw-p-6 tw-mb-6 tw-text-left">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">Application Summary</h3>
                <div className="tw-space-y-4 tw-text-sm">
                  {profile && (
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3">
                      <div>
                        <span className="tw-text-gray-600">Name:</span>
                        <span className="tw-ml-2 tw-font-medium">
                          {profile.firstname} {profile.lastname}
                        </span>
                      </div>
                      <div>
                        <span className="tw-text-gray-600">Email:</span>
                        <span className="tw-ml-2 tw-font-medium">{profile.email}</span>
                      </div>
                    </div>
                  )}
                  {applicationData.currentRole && (
                    <div>
                      <span className="tw-text-gray-600">Current Role:</span>
                      <span className="tw-ml-2 tw-font-medium">{applicationData.currentRole}</span>
                    </div>
                  )}
                  {applicationData.yearsOfExperience !== undefined && (
                    <div>
                      <span className="tw-text-gray-600">Experience:</span>
                      <span className="tw-ml-2 tw-font-medium">
                        {applicationData.yearsOfExperience} years
                      </span>
                    </div>
                  )}
                  {applicationData.expertiseAreas?.length ? (
                    <div>
                      <span className="tw-text-gray-600">Expertise Areas:</span>
                      <span className="tw-ml-2 tw-font-medium">
                        {applicationData.expertiseAreas.join(', ')}
                      </span>
                    </div>
                  ) : null}
                  {applicationData.mentoringTopics?.length ? (
                    <div>
                      <span className="tw-text-gray-600">Mentoring Topics:</span>
                      <span className="tw-ml-2 tw-font-medium">
                        {applicationData.mentoringTopics.join(', ')}
                      </span>
                    </div>
                  ) : null}
                  {applicationData.availabilityDays?.length ? (
                    <div>
                      <span className="tw-text-gray-600">Preferred Days:</span>
                      <span className="tw-ml-2 tw-font-medium">
                        {applicationData.availabilityDays.join(', ')}
                      </span>
                    </div>
                  ) : null}
                  {applicationData.meetingFormats?.length ? (
                    <div>
                      <span className="tw-text-gray-600">Session Format:</span>
                      <span className="tw-ml-2 tw-font-medium">
                        {applicationData.meetingFormats.join(', ')}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            <div className={`${isRejected ? 'tw-bg-red-50 tw-border-red-200' : 'tw-bg-blue-50 tw-border-blue-200'} tw-border tw-rounded-lg tw-p-4 tw-mb-6 tw-text-left`}>
              <div className="tw-flex tw-items-start">
                <svg
                  className={`tw-w-5 tw-h-5 tw-mr-3 tw-mt-0.5 ${isRejected ? 'tw-text-red-600' : 'tw-text-blue-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h4 className="tw-font-medium tw-text-gray-900 tw-mb-1">
                    {isRejected ? 'Next Steps' : 'Expected Timeline'}
                  </h4>
                  <p className={`tw-text-sm ${isRejected ? 'tw-text-red-700' : 'tw-text-blue-700'}`}>
                    {isRejected
                      ? 'Please reach out to the admin team for feedback and update your application with the requested details.'
                      : 'Applications are typically reviewed within 2-3 business days. You will receive an email once your application has been processed.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="tw-flex tw-items-center tw-justify-center tw-text-sm tw-text-gray-500">
              <svg className="tw-w-4 tw-h-4 tw-mr-2 tw-animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Checking for updates...
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
