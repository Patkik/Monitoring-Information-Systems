import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { getPublicProfile } from '../../shared/services/profileApi';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    (async () => {
      try {
        if (user?.id) {
          const data = await getPublicProfile(user.id);
          setProfile(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardLayout>
      <div className="tw-space-y-6">
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100 tw-overflow-hidden">
          <div className="tw-flex tw-items-center tw-justify-between tw-p-6 tw-border-b tw-border-gray-100">
            <div>
              <h1 className="tw-text-lg tw-font-semibold tw-text-gray-900">My Profile</h1>
              <p className="tw-text-sm tw-text-gray-500">View and manage your public profile information</p>
            </div>
            <Link 
              to="/profile/settings" 
              className="tw-inline-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-primary tw-text-white tw-text-sm tw-font-medium tw-rounded-lg hover:tw-bg-primary/90 tw-transition-colors"
            >
              <svg className="tw-w-4 tw-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Settings
            </Link>
          </div>

          {loading ? (
            <div className="tw-p-12 tw-flex tw-justify-center tw-items-center">
              <div className="tw-animate-spin tw-rounded-full tw-h-8 tw-w-8 tw-border-b-2 tw-border-primary" />
            </div>
          ) : (
            <div className="tw-p-6">
              <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-8 tw-items-start">
                <div className="tw-flex-shrink-0">
                  <div className="tw-w-32 tw-h-32 tw-rounded-2xl tw-overflow-hidden tw-border-4 tw-border-white tw-shadow-lg tw-bg-gray-100">
                    <img 
                      src={profile?.profile?.photoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile?.displayName || 'User') + '&background=F3F4F6&color=6B7280&size=128'} 
                      alt="avatar" 
                      className="tw-w-full tw-h-full tw-object-cover" 
                    />
                  </div>
                </div>
                
                <div className="tw-flex-1 tw-space-y-6">
                  <div>
                    <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">{profile?.displayName || 'Your Name'}</h2>
                    <div className="tw-flex tw-items-center tw-gap-4 tw-mt-2">
                      <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1 tw-rounded-full tw-bg-gray-100 tw-text-gray-700 tw-text-sm tw-font-medium">
                        <svg className="tw-w-4 tw-h-4 tw-text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {profile?.profile?.timezone || 'Timezone not set'}
                      </span>
                    </div>
                  </div>

                  <div className="tw-border-t tw-border-gray-100 tw-pt-6">
                    <h3 className="tw-text-sm tw-font-semibold tw-text-gray-900 tw-uppercase tw-tracking-wider tw-mb-3">About</h3>
                    {profile?.profile?.bio ? (
                      <p className="tw-text-gray-600 tw-leading-relaxed">{profile.profile.bio}</p>
                    ) : (
                      <p className="tw-text-gray-400 tw-italic">No bio provided yet.</p>
                    )}
                  </div>

                  {profile?.profile?.education && (
                    <div className="tw-border-t tw-border-gray-100 tw-pt-6">
                      <h3 className="tw-text-sm tw-font-semibold tw-text-gray-900 tw-uppercase tw-tracking-wider tw-mb-3">Education</h3>
                      <div className="tw-bg-gray-50 tw-rounded-xl tw-p-4 tw-flex tw-items-start tw-gap-4">
                        <div className="tw-bg-white tw-p-2 tw-rounded-lg tw-shadow-sm">
                          <svg className="tw-w-6 tw-h-6 tw-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                        </div>
                        <div>
                          <p className="tw-text-gray-900 tw-font-medium">{profile.profile.education.program || 'Program not specified'}</p>
                          <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                            {profile.profile.education.major ? `${profile.profile.education.major} • ` : ''} 
                            {profile.profile.education.yearLevel || 'Year not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
