import React, { useCallback, useEffect, useMemo, useState } from 'react';
import logger from '../../shared/utils/logger';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const buildApiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const STATUS_BADGE_STYLES = {
  approved: 'tw-bg-green-100 tw-text-green-800',
  pending: 'tw-bg-yellow-100 tw-text-yellow-800',
  rejected: 'tw-bg-red-100 tw-text-red-700',
  default: 'tw-bg-gray-100 tw-text-gray-700'
};

// Map backend statuses to UI classification
const classifyStatus = (status) => (status === 'not_submitted' ? 'pending' : status || 'default');

const ROLE_BADGE_STYLES = {
  mentor: 'tw-bg-blue-100 tw-text-blue-800',
  mentee: 'tw-bg-purple-100 tw-text-purple-800',
  admin: 'tw-bg-slate-200 tw-text-slate-700',
  default: 'tw-bg-gray-100 tw-text-gray-700'
};

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

const formatList = (value) => {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : 'N/A';
  }

  if (typeof value === 'string') {
    return value.trim() || 'N/A';
  }

  return 'N/A';
};

const getApplicationRole = (application) => application.applicationRole || application.role || 'mentee';

const getStatusBadgeClass = (status) => STATUS_BADGE_STYLES[classifyStatus(status)] || STATUS_BADGE_STYLES.default;

const getRoleBadgeClass = (role) => ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.default;

const focusLabelByRole = (role) => (role === 'mentor' ? 'Expertise Areas' : 'Major');

const focusValueByRole = (role, data) => {
  if (!data) {
    return '';
  }

  if (role === 'mentor') {
    return formatList(data.expertiseAreas);
  }

  return data.major || '';
};

const secondaryLabelByRole = (role) => (role === 'mentor' ? 'Years Experience' : 'Preferred Language');

const secondaryValueByRole = (role, data) => {
  if (!data) {
    return 'N/A';
  }

  if (role === 'mentor') {
    if (data.yearsOfExperience === 0) {
      return '0 years';
    }
    if (data.yearsOfExperience) {
      return `${data.yearsOfExperience} year${data.yearsOfExperience === 1 ? '' : 's'}`;
    }
    return 'N/A';
  }

  return data.programmingLanguage || 'N/A';
};

const supportingDocumentLabel = {
  mentor: 'Supporting Document',
  mentee: 'Certificate of Registration'
};

const buildQueryUrl = (status, role) => {
  const params = new URLSearchParams();
  params.set('status', status);
  params.set('role', role);
  params.set('limit', '50');
  return `${buildApiUrl('/admin/applications')}?${params.toString()}`;
};

export default function ApplicationReviewPanel() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(buildQueryUrl(statusFilter, roleFilter), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (err) {
      logger.error('Failed to fetch applications:', err);
      setError('Unable to fetch applications. Please try again.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async (userId) => {
    await mutateApplicationStatus(userId, 'approve');
  };

  const handleReject = async (userId) => {
    await mutateApplicationStatus(userId, 'reject');
  };

  const mutateApplicationStatus = async (userId, action) => {
    setIsMutating(true);
    try {
      const response = await fetch(buildApiUrl(`/admin/applications/${userId}/${action}`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      await fetchApplications();
      setShowApplicationModal(false);
    } catch (err) {
      logger.error('Failed to update application status:', err);
      window.alert('Failed to update application status. Please try again.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    const name = selectedUser ? `${selectedUser.firstname} ${selectedUser.lastname}`.trim() : 'this user';
    const adminNote = newRole === 'admin'
      ? '\n\nNote: Admin access requires approval. The user will be marked as pending until approved.'
      : '';

    const ok = window.confirm(`Change role for ${name} to “${newRole}”?${adminNote}`);
    if (!ok) return;

    setIsMutating(true);
    try {
      const response = await fetch(buildApiUrl(`/admin/users/${userId}/role`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      await fetchApplications();
      setShowRoleModal(false);
      window.alert(`Success: User role updated to ${newRole}.`);
    } catch (err) {
      logger.error('Failed to update user role:', err);
      window.alert('Failed to update user role. Please try again.');
    } finally {
      setIsMutating(false);
    }
  };

  const openApplicationDetails = (application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const openRoleModal = (application) => {
    setSelectedUser(application);
    setShowRoleModal(true);
  };

  const derivedApplications = useMemo(() => applications, [applications]);
  const focusColumnLabel = roleFilter === 'all' ? 'Focus' : focusLabelByRole(roleFilter);
  const secondaryColumnLabel = roleFilter === 'all' ? 'Key Detail' : secondaryLabelByRole(roleFilter);

  if (loading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
        <div className="tw-animate-spin tw-rounded-full tw-h-12 tw-w-12 tw-border-b-2 tw-border-purple-500" />
      </div>
    );
  }

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200">
      <div className="tw-px-6 tw-py-4 tw-border-b tw-border-gray-200">
        <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-justify-between lg:tw-items-center tw-gap-4">
          <div>
            <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Application Review</h2>
            <p className="tw-text-sm tw-text-gray-500">
              Manage mentor and mentee applications from a single view.
            </p>
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="mentor">Mentor Applications</option>
              <option value="mentee">Mentee Applications</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Statuses</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="tw-px-6 tw-py-3 tw-bg-red-50 tw-text-red-700 tw-text-sm">{error}</div>
      )}

      <div className="tw-overflow-x-auto">
        <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
          <thead className="tw-bg-gray-50">
            <tr>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Applicant
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Email
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Role
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                {focusColumnLabel}
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                {secondaryColumnLabel}
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Submitted
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Status
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
            {derivedApplications.map((application) => {
              const applicationRole = getApplicationRole(application);
              const applicationData = application.applicationData || {};

              return (
                <tr key={application._id} className="hover:tw-bg-gray-50">
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                    <div className="tw-text-sm tw-font-medium tw-text-gray-900">
                      {application.firstname} {application.lastname}
                    </div>
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                    <div className="tw-text-sm tw-text-gray-600">{application.email}</div>
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                    <span className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium ${getRoleBadgeClass(applicationRole)}`}>
                      {applicationRole.charAt(0).toUpperCase() + applicationRole.slice(1)}
                    </span>
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-900">
                    {focusValueByRole(applicationRole, applicationData)}
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-900">
                    {secondaryValueByRole(applicationRole, applicationData)}
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-900">
                    {formatDate(application.applicationSubmittedAt)}
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                    <span className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold ${getStatusBadgeClass(application.applicationStatus)}`}>
                      {classifyStatus(application.applicationStatus)}
                    </span>
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                    <div className="tw-flex tw-flex-wrap tw-gap-3 tw-text-sm tw-font-medium">
                      <button
                        type="button"
                        onClick={() => openApplicationDetails(application)}
                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-bg-purple-50 tw-text-purple-700 hover:tw-bg-purple-100 tw-transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => openRoleModal(application)}
                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-bg-blue-50 tw-text-blue-700 hover:tw-bg-blue-100 tw-transition-colors"
                      >
                        Change Role
                      </button>
                      {(classifyStatus(application.applicationStatus) === 'pending') && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(application._id)}
                            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-bg-emerald-50 tw-text-emerald-700 hover:tw-bg-emerald-100 tw-transition-colors"
                            disabled={isMutating}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(application._id)}
                            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-bg-red-50 tw-text-red-700 hover:tw-bg-red-100 tw-transition-colors"
                            disabled={isMutating}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {derivedApplications.length === 0 && !error && (
        <div className="tw-text-center tw-py-12">
          <div className="tw-inline-flex tw-items-center tw-justify-center tw-text-gray-400 tw-text-4xl tw-font-semibold tw-mb-4">
            *
          </div>
          <p className="tw-text-gray-600 tw-text-lg">No applications match the selected filters.</p>
          <p className="tw-text-gray-400 tw-text-sm">Adjust the filters to see more applications.</p>
        </div>
      )}

      {showApplicationModal && selectedApplication && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-xl tw-w-full tw-max-w-3xl tw-mx-4 tw-max-h-[85vh] tw-overflow-y-auto">
            <div className="tw-px-6 tw-py-4 tw-border-b tw-border-gray-200 tw-flex tw-items-start tw-justify-between">
              <div>
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Application Details</h3>
                <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
                  <span className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium ${getRoleBadgeClass(getApplicationRole(selectedApplication))}`}>
                    {getApplicationRole(selectedApplication).charAt(0).toUpperCase() + getApplicationRole(selectedApplication).slice(1)} Application
                  </span>
                  <span className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold ${getStatusBadgeClass(selectedApplication.applicationStatus)}`}>
                    {classifyStatus(selectedApplication.applicationStatus)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApplicationModal(false)}
                className="tw-text-gray-400 hover:tw-text-gray-600"
              >
                <svg className="tw-w-6 tw-h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="tw-px-6 tw-py-5 tw-space-y-6">
              <section className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                <div>
                  <p className="tw-text-xs tw-font-medium tw-text-gray-500">Name</p>
                  <p className="tw-text-sm tw-text-gray-900 tw-font-medium">
                    {selectedApplication.firstname} {selectedApplication.lastname}
                  </p>
                </div>
                <div>
                  <p className="tw-text-xs tw-font-medium tw-text-gray-500">Email</p>
                  <p className="tw-text-sm tw-text-gray-900">{selectedApplication.email}</p>
                </div>
                <div>
                  <p className="tw-text-xs tw-font-medium tw-text-gray-500">Submitted</p>
                  <p className="tw-text-sm tw-text-gray-900">{formatDate(selectedApplication.applicationSubmittedAt)}</p>
                </div>
              </section>

              {getApplicationRole(selectedApplication) === 'mentee' ? (
                <section className="tw-space-y-4">
                  <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                    <InfoBlock label="Year Level" value={selectedApplication.applicationData?.yearLevel} />
                    <InfoBlock label="Program" value={selectedApplication.applicationData?.program} />
                    <InfoBlock label="Major" value={selectedApplication.applicationData?.major} />
                    <InfoBlock label="Programming Language" value={selectedApplication.applicationData?.programmingLanguage} />
                  </div>
                  <InfoBlock label="Specific Skills" value={selectedApplication.applicationData?.specificSkills} />
                  <InfoBlock label="Motivation" value={selectedApplication.applicationData?.motivation} />
                </section>
              ) : (
                <section className="tw-space-y-4">
                  <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                    <InfoBlock label="Current Role" value={selectedApplication.applicationData?.currentRole} />
                    <InfoBlock label="Organization" value={selectedApplication.applicationData?.organization} />
                    <InfoBlock
                      label="Years of Experience"
                      value={secondaryValueByRole('mentor', selectedApplication.applicationData)}
                    />
                    <InfoBlock
                      label="Availability (hrs/week)"
                      value={selectedApplication.applicationData?.availabilityHoursPerWeek ?? 'N/A'}
                    />
                  </div>
                  <InfoBlock label="Expertise Areas" value={formatList(selectedApplication.applicationData?.expertiseAreas)} />
                  <InfoBlock label="Mentoring Topics" value={formatList(selectedApplication.applicationData?.mentoringTopics)} />
                  <InfoBlock label="Preferred Meeting Formats" value={formatList(selectedApplication.applicationData?.meetingFormats)} />
                  <InfoBlock label="Availability Days" value={formatList(selectedApplication.applicationData?.availabilityDays)} />
                  <InfoBlock label="Professional Summary" value={selectedApplication.applicationData?.professionalSummary} />
                  <InfoBlock label="Achievements" value={selectedApplication.applicationData?.achievements} />
                  <InfoBlock label="Motivation" value={selectedApplication.applicationData?.motivation} />
                  <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                    <InfoLink label="LinkedIn" value={selectedApplication.applicationData?.linkedinUrl} />
                    <InfoLink label="Portfolio" value={selectedApplication.applicationData?.portfolioUrl} />
                  </div>
                </section>
              )}

              <section className="tw-space-y-2">
                <p className="tw-text-xs tw-font-medium tw-text-gray-500">{supportingDocumentLabel[getApplicationRole(selectedApplication)]}</p>
                {getApplicationRole(selectedApplication) === 'mentee' && selectedApplication.applicationData?.corUrl && (
                  <a
                    href={selectedApplication.applicationData.corUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-purple-600 hover:tw-text-purple-800"
                  >
                    View COR
                  </a>
                )}
                {getApplicationRole(selectedApplication) === 'mentor' && selectedApplication.applicationData?.supportingDocumentUrl ? (
                  <a
                    href={selectedApplication.applicationData.supportingDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-purple-600 hover:tw-text-purple-800"
                  >
                    View Document
                  </a>
                ) : getApplicationRole(selectedApplication) === 'mentor' ? (
                  <p className="tw-text-sm tw-text-gray-500">No supporting document provided.</p>
                ) : null}
              </section>
            </div>

            {classifyStatus(selectedApplication.applicationStatus) === 'pending' && (
              <div className="tw-px-6 tw-py-4 tw-border-t tw-border-gray-200 tw-flex tw-justify-end tw-gap-3">
                <button
                  type="button"
                  onClick={() => handleReject(selectedApplication._id)}
                  className="tw-px-4 tw-py-2 tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-rounded-lg tw-text-sm"
                  disabled={isMutating}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(selectedApplication._id)}
                  className="tw-px-4 tw-py-2 tw-bg-green-600 hover:tw-bg-green-700 tw-text-white tw-rounded-lg tw-text-sm"
                  disabled={isMutating}
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showRoleModal && selectedUser && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-xl tw-w-full tw-max-w-md tw-mx-4">
            <div className="tw-px-6 tw-py-4 tw-border-b tw-border-gray-200 tw-flex tw-items-center tw-justify-between">
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Update User Role</h3>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="tw-text-gray-400 hover:tw-text-gray-600"
              >
                <svg className="tw-w-6 tw-h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="tw-px-6 tw-py-5 tw-space-y-4">
              <p className="tw-text-sm tw-text-gray-600">
                Update the primary role for <span className="tw-font-medium">{selectedUser.firstname} {selectedUser.lastname}</span>.
              </p>
              <div className="tw-space-y-3">
                <RoleButton
                  label="Mentor"
                  description="Access mentor dashboards, mentee assignments, and resources."
                  onClick={() => handleRoleUpdate(selectedUser._id, 'mentor')}
                  disabled={isMutating}
                />
                <RoleButton
                  label="Mentee"
                  description="Access mentee dashboards, mentor matching, and learning plans."
                  onClick={() => handleRoleUpdate(selectedUser._id, 'mentee')}
                  disabled={isMutating}
                />
                <RoleButton
                  label="Admin"
                  description="Full administrative permissions across the platform."
                  onClick={() => handleRoleUpdate(selectedUser._id, 'admin')}
                  disabled={isMutating}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value }) {
  const resolvedValue = value === undefined || value === null || value === '' ? 'N/A' : value;

  return (
    <div>
      <p className="tw-text-xs tw-font-medium tw-text-gray-500">{label}</p>
      <p className="tw-text-sm tw-text-gray-900">{resolvedValue}</p>
    </div>
  );
}

function InfoLink({ label, value }) {
  if (!value) {
    return (
      <div>
        <p className="tw-text-xs tw-font-medium tw-text-gray-500">{label}</p>
        <p className="tw-text-sm tw-text-gray-500">Not provided</p>
      </div>
    );
  }

  return (
    <div>
      <p className="tw-text-xs tw-font-medium tw-text-gray-500">{label}</p>
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-purple-600 hover:tw-text-purple-800"
      >
        Visit Link
      </a>
    </div>
  );
}

function RoleButton({ label, description, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="tw-w-full tw-text-left tw-border tw-border-gray-200 hover:tw-border-purple-400 tw-rounded-lg tw-px-4 tw-py-3 tw-transition-colors disabled:tw-opacity-60"
    >
      <p className="tw-text-sm tw-font-semibold tw-text-gray-900">{label}</p>
      <p className="tw-text-xs tw-text-gray-500">{description}</p>
    </button>
  );
}
