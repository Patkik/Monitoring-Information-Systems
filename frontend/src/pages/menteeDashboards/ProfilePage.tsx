import React, { useMemo, useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import AdminLayout from '../../components/layouts/AdminLayout';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const buildApiUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

type StoredUser = {
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string;
  applicationStatus?: string;
  applicationData?: {
    professionalSummary?: string;
    program?: string;
    mentoringGoals?: string;
    interests?: string[];
  };
};

import logger from '../../shared/utils/logger';

const readUserFromStorage = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const normalizedRole = typeof parsed.role === 'string' ? parsed.role.toLowerCase() : undefined;
      return { ...parsed, role: normalizedRole };
    }
  } catch (error) {
    logger.error('Unable to read profile from storage:', error);
  }
  return null;
};

const ProfilePage: React.FC = () => {
  const stored = useMemo(() => readUserFromStorage(), []);
  const [profile, setProfile] = useState(stored);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // attempt to refresh profile from server if token is present
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(buildApiUrl('/auth/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const normalizedRole = typeof data.role === 'string' ? data.role.toLowerCase() : data.role;
          const merged = { ...data, role: normalizedRole } as any;
          setProfile(merged);
          // persist to localStorage to keep rest of UI in sync
          localStorage.setItem('user', JSON.stringify(merged));
        }
      } catch (err) {
        // ignore - keep local copy
        logger.error('Failed to refresh profile:', err);
      }
    })();
  }, []);

  const heading = profile?.firstname || profile?.lastname
    ? `${profile.firstname ?? ''} ${profile.lastname ?? ''}`.trim()
    : profile?.email ?? 'Profile';

  // Form state for editing
  const [form, setForm] = useState({
    firstname: profile?.firstname || '',
    lastname: profile?.lastname || '',
    bio: profile?.applicationData?.professionalSummary || '',
    academicBackground: profile?.applicationData?.program || '',
    interests: Array.isArray(profile?.applicationData?.interests) ? (profile.applicationData.interests as string[]).join(', ') : (profile?.applicationData?.interests || ''),
    goals: profile?.applicationData?.mentoringGoals || ''
  });

  useEffect(() => {
    setForm({
      firstname: profile?.firstname || '',
      lastname: profile?.lastname || '',
      bio: profile?.applicationData?.professionalSummary || '',
      academicBackground: profile?.applicationData?.program || '',
      interests: Array.isArray(profile?.applicationData?.interests) ? (profile.applicationData.interests as string[]).join(', ') : (profile?.applicationData?.interests || ''),
      goals: profile?.applicationData?.mentoringGoals || ''
    });
  }, [profile]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('NO_TOKEN');
      const payload = {
        firstname: form.firstname,
        lastname: form.lastname,
        applicationData: {
          professionalSummary: form.bio,
          program: form.academicBackground,
          mentoringGoals: form.goals,
          interests: form.interests.split(',').map(s => s.trim()).filter(Boolean)
        }
      };
      const res = await fetch(buildApiUrl('/auth/profile'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'UPDATE_FAILED');
      }
      const data = await res.json();
      setProfile(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setMessage('Profile saved successfully');
      setEditing(false);
    } catch (err: any) {
      logger.error('Failed to save profile:', err);
      setMessage(typeof err === 'string' ? err : (err.message || 'Failed to save'));
    } finally {
      setLoading(false);
    }
  };

  const Layout = profile?.role === 'admin' ? AdminLayout : DashboardLayout;

  return (
    <Layout>
      <div className="tw-max-w-3xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-10">
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-2xl tw-shadow-sm tw-p-6 tw-space-y-6">
          <header className="tw-space-y-2">
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">{heading}</h1>
            <p className="tw-text-sm tw-text-gray-600">
              Manage your account details and review your participation status in the mentoring platform.
            </p>
          </header>

          {profile ? (
            <div>
              <dl className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
                <div>
                  <dt className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Email</dt>
                  <dd className="tw-text-base tw-text-gray-800">{profile.email}</dd>
                </div>
                <div>
                  <dt className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Role</dt>
                  <dd className="tw-text-base tw-text-gray-800">
                    {profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Application Status</dt>
                  <dd className="tw-text-base tw-text-gray-800">
                    {profile.applicationStatus ? profile.applicationStatus.replace('_', ' ') : 'Not submitted'}
                  </dd>
                </div>
              </dl>

              {profile.role === 'mentee' && (
                <div className="tw-mt-6">
                  {message && (
                    <div className="tw-mb-4 tw-text-sm tw-text-green-700">{message}</div>
                  )}
                  {!editing ? (
                    <div>
                      <h3 className="tw-text-lg tw-font-semibold tw-mb-2">About You</h3>
                      <p className="tw-text-sm tw-text-gray-700">{profile.applicationData?.professionalSummary || 'No bio provided.'}</p>
                      <h4 className="tw-text-sm tw-font-medium tw-mt-4">Academic Background</h4>
                      <p className="tw-text-sm tw-text-gray-700">{profile.applicationData?.program || 'Not specified'}</p>
                      <h4 className="tw-text-sm tw-font-medium tw-mt-4">Interests</h4>
                      <p className="tw-text-sm tw-text-gray-700">{(profile.applicationData?.interests || []).join(', ') || 'None specified'}</p>
                      <h4 className="tw-text-sm tw-font-medium tw-mt-4">Goals</h4>
                      <p className="tw-text-sm tw-text-gray-700">{profile.applicationData?.mentoringGoals || 'Not specified'}</p>
                      <div className="tw-mt-4">
                        <button onClick={() => setEditing(true)} className="tw-px-4 tw-py-2 tw-bg-purple-600 tw-text-white tw-rounded">Edit Profile</button>
                      </div>
                    </div>
                  ) : (
                    <div className="tw-mt-4 tw-space-y-4">
                      <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Firstname</label>
                        <input name="firstname" value={form.firstname} onChange={onChange} placeholder="First name" title="Firstname" className="tw-w-full tw-px-3 tw-py-2 tw-border tw-rounded" />
                      </div>
                      <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Lastname</label>
                        <input name="lastname" value={form.lastname} onChange={onChange} placeholder="Last name" title="Lastname" className="tw-w-full tw-px-3 tw-py-2 tw-border tw-rounded" />
                      </div>
                      <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Bio</label>
                        <textarea name="bio" value={form.bio} onChange={onChange} placeholder="Write a short bio" title="Bio" className="tw-w-full tw-px-3 tw-py-2 tw-border tw-rounded" rows={4} />
                      </div>
                      <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Program / Degree</label>
                        <select name="academicBackground" value={form.academicBackground} onChange={onChange} title="Academic Background" className="tw-w-full tw-px-3 tw-py-2 tw-border tw-rounded tw-bg-white">
                          <option value="" disabled>Select your program</option>
                          <option value="BSIT">BSIT</option>
                          <option value="BSEMC">BSEMC</option>
                        </select>
                      </div>
                      <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Interests (comma separated)</label>
                        <input name="interests" value={form.interests} onChange={onChange} placeholder="comma separated interests" title="Interests" className="tw-w-full tw-px-3 tw-py-2 tw-border tw-rounded" />
                      </div>
                      <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">Goals</label>
                        <textarea name="goals" value={form.goals} onChange={onChange} placeholder="What do you want to achieve?" title="Goals" className="tw-w-full tw-px-3 tw-py-2 tw-border tw-rounded" rows={3} />
                      </div>
                      <div className="tw-flex tw-gap-2">
                        <button onClick={saveProfile} disabled={loading} className="tw-px-4 tw-py-2 tw-bg-green-600 tw-text-white tw-rounded">{loading ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => setEditing(false)} className="tw-px-4 tw-py-2 tw-border tw-rounded">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="tw-rounded-lg tw-border tw-border-yellow-200 tw-bg-yellow-50 tw-p-4 tw-text-sm tw-text-yellow-800">
              No profile information is available. Please log in again to refresh your account data.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
