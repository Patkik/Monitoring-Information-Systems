import React, { useEffect, useState } from 'react';
import logger from '../shared/utils/logger';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { buildApiUrl } from '../shared/config/apiClient';

export default function AdminPendingPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(buildApiUrl('/auth/profile'), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.ok) {
          const user = await res.json();
          setStatus(user.applicationStatus || 'pending');
          // Keep local storage in sync
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...stored, ...user }));
          if ((user.role === 'admin') && user.applicationStatus === 'approved') {
            navigate('/admin/dashboard');
          }
        }
      } catch (err) {
        logger.error('Failed to check admin approval:', err);
      } finally {
        setLoading(false);
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="tw-min-h-screen tw-bg-gray-50 tw-flex tw-items-center tw-justify-center">
          <div className="tw-animate-spin tw-rounded-full tw-h-12 tw-w-12 tw-border-b-2 tw-border-purple-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  const isRejected = status === 'rejected';

  return (
    <DashboardLayout>
      <div className="tw-min-h-screen tw-bg-gray-50 tw-py-8">
        <div className="tw-max-w-2xl tw-mx-auto tw-px-4">
          <div className="tw-flex tw-justify-between tw-items-center tw-mb-8">
            <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Admin Access Approval</h1>
            <button
              onClick={() => { localStorage.clear(); navigate('/login'); }}
              className="tw-px-4 tw-py-2 tw-text-purple-600 hover:tw-text-purple-700 tw-font-medium tw-transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-8 tw-text-center">
            <div className="tw-mb-6">
              <div className={`tw-w-24 tw-h-24 tw-mx-auto tw-rounded-full tw-flex tw-items-center tw-justify-center ${isRejected ? 'tw-bg-red-100' : 'tw-bg-purple-100'}`}>
                <svg className={`tw-w-12 tw-h-12 ${isRejected ? 'tw-text-red-600' : 'tw-text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isRejected ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
            </div>

            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-4">
              {isRejected ? 'Access Not Granted' : 'Your Admin Access Is Under Review'}
            </h2>
            <p className="tw-text-lg tw-text-gray-600 tw-mb-6">
              {isRejected
                ? 'An administrator has declined your admin access. Please contact the program owner for assistance.'
                : 'Thank you. An owner will review and grant admin access if appropriate. You will be notified once approved.'}
            </p>

            <div className={`tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-rounded-full tw-font-medium tw-mb-8 ${isRejected ? 'tw-bg-red-100 tw-text-red-700' : 'tw-bg-yellow-100 tw-text-yellow-800'}`}>
              <svg className="tw-w-5 tw-h-5 tw-mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {isRejected ? 'Action Needed' : 'Pending Owner Approval'}
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
