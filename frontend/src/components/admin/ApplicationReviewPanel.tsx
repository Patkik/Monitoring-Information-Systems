import React, { useCallback, useEffect, useMemo, useState } from 'react';
import logger from '../../shared/utils/logger';
import { Card, Button, StatusBadge, LoadingSpinner, EmptyState } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const classifyStatus = (status: string | undefined) => (status === 'not_submitted' ? 'pending' : status || 'default');

const getStatusBadgeVariant = (status: string | undefined): "success" | "warning" | "error" | "info" | "neutral" => {
  const s = classifyStatus(status);
  switch (s) {
    case 'approved': return 'success';
    case 'pending': return 'warning';
    case 'rejected': return 'error';
    default: return 'neutral';
  }
};

const getRoleBadgeVariant = (role: string | undefined): "success" | "warning" | "error" | "info" | "neutral" => {
  switch (role) {
    case 'mentor': return 'info';
    case 'mentee': return 'success';
    case 'admin': return 'warning';
    default: return 'neutral';
  }
};

const formatDate = (value: string | undefined | null) => {
  if (!value) return 'N/A';
  try { return new Date(value).toLocaleDateString(); } catch { return 'N/A'; }
};

const formatList = (value: string | string[] | undefined | null) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'N/A';
  if (typeof value === 'string') return value.trim() || 'N/A';
  return 'N/A';
};

const getApplicationRole = (application: any) => application.applicationRole || application.role || 'mentee';

const focusLabelByRole = (role: string) => (role === 'mentor' ? 'Expertise Areas' : 'Major');

const focusValueByRole = (role: string, data: any) => {
  if (!data) return '';
  if (role === 'mentor') return formatList(data.expertiseAreas);
  return data.major || '';
};

const secondaryLabelByRole = (role: string) => (role === 'mentor' ? 'Years Experience' : 'Preferred Language');

const secondaryValueByRole = (role: string, data: any) => {
  if (!data) return 'N/A';
  if (role === 'mentor') {
    if (data.yearsOfExperience === 0) return '0 years';
    if (data.yearsOfExperience) return `${data.yearsOfExperience} year${data.yearsOfExperience === 1 ? '' : 's'}`;
    return 'N/A';
  }
  return data.programmingLanguage || 'N/A';
};

const supportingDocumentLabel: Record<string, string> = {
  mentor: 'Supporting Document',
  mentee: 'Certificate of Registration'
};

const buildQueryUrl = (status: string, role: string) => {
  const params = new URLSearchParams();
  params.set('status', status);
  params.set('role', role);
  params.set('limit', '50');
  return `${buildApiUrl('/admin/applications')}?${params.toString()}`;
};

export default function ApplicationReviewPanel() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(buildQueryUrl(statusFilter, roleFilter), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load applications');
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

  const handleApprove = async (userId: string) => {
    await mutateApplicationStatus(userId, 'approve');
  };

  const handleReject = async (userId: string) => {
    await mutateApplicationStatus(userId, 'reject');
  };

  const mutateApplicationStatus = async (userId: string, action: 'approve' | 'reject') => {
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
      if (!response.ok) throw new Error('Failed to update application status');
      await fetchApplications();
      setShowApplicationModal(false);
    } catch (err) {
      logger.error('Failed to update application status:', err);
      window.alert('Failed to update application status. Please try again.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
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
      if (!response.ok) throw new Error('Failed to update user role');
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

  const openApplicationDetails = (application: any) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const openRoleModal = (application: any) => {
    setSelectedUser(application);
    setShowRoleModal(true);
  };

  const derivedApplications = useMemo(() => applications, [applications]);
  const focusColumnLabel = roleFilter === 'all' ? 'Focus' : focusLabelByRole(roleFilter);
  const secondaryColumnLabel = roleFilter === 'all' ? 'Key Detail' : secondaryLabelByRole(roleFilter);

  return (
    <Card className="tw-p-0 tw-overflow-hidden tw-flex tw-flex-col tw-border-[var(--border-color)]">
      <div className="tw-px-6 tw-py-4 tw-border-b tw-border-[var(--border-color)] tw-bg-[var(--surface-secondary)]">
        <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-justify-between lg:tw-items-center tw-gap-4">
          <div>
            <h2 className="tw-text-base tw-font-semibold tw-text-[var(--text-primary)]">Applications</h2>
            <p className="tw-text-sm tw-text-[var(--text-secondary)] tw-mt-0.5">
              Review and manage pending mentor and mentee applications.
            </p>
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="tw-bg-[var(--surface-background)] tw-border tw-border-[var(--border-color)] tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-text-[var(--text-primary)] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50"
            >
              <option value="all">All Roles</option>
              <option value="mentor">Mentors Only</option>
              <option value="mentee">Mentees Only</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="tw-bg-[var(--surface-background)] tw-border tw-border-[var(--border-color)] tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-text-[var(--text-primary)] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Statuses</option>
            </select>
            <Button variant="secondary" size="sm" onClick={() => fetchApplications()}>
                Refresh
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="tw-px-6 tw-py-3 tw-bg-red-50 dark:tw-bg-red-900/20 tw-text-red-700 dark:tw-text-red-400 tw-text-sm border-b border-[var(--border-color)]">
            {error}
        </div>
      )}

      {loading ? (
        <div className="tw-flex tw-items-center tw-justify-center tw-p-12">
            <LoadingSpinner label="Loading applications..." size="lg" />
        </div>
      ) : (
        <div className="tw-overflow-x-auto">
          <table className="tw-min-w-full tw-divide-y tw-divide-[var(--border-color)]">
            <thead className="tw-bg-[var(--surface-secondary)]">
              <tr>
                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Applicant</th>
                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Role</th>
                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">{focusColumnLabel}</th>
                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">{secondaryColumnLabel}</th>
                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Submitted</th>
                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Status</th>
                <th className="tw-px-6 tw-py-3.5 tw-text-right tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="tw-divide-y tw-divide-[var(--border-color)] tw-bg-[var(--surface-card)]">
              {derivedApplications.length === 0 ? (
                <tr>
                    <td colSpan={7}>
                        <EmptyState title="No applications found" description="No applications match your current filters." />
                    </td>
                </tr>
              ) : (
                derivedApplications.map((application) => {
                  const applicationRole = getApplicationRole(application);
                  const applicationData = application.applicationData || {};
                  const isPending = classifyStatus(application.applicationStatus) === 'pending';

                  return (
                    <tr key={application._id} className="hover:tw-bg-[var(--surface-hover)] tw-transition-colors">
                      <td className="tw-px-6 tw-py-4">
                        <div className="tw-text-sm tw-font-semibold tw-text-[var(--text-primary)]">
                          {application.firstname} {application.lastname}
                        </div>
                        <div className="tw-text-[13px] tw-text-[var(--text-tertiary)] tw-mt-0.5">{application.email}</div>
                      </td>
                      <td className="tw-px-6 tw-py-4">
                        <StatusBadge 
                            variant={getRoleBadgeVariant(applicationRole)} 
                            label={applicationRole.charAt(0).toUpperCase() + applicationRole.slice(1)} 
                        />
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-[var(--text-secondary)]">
                        {focusValueByRole(applicationRole, applicationData)}
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-[var(--text-secondary)]">
                        {secondaryValueByRole(applicationRole, applicationData)}
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-text-[13px] tw-text-[var(--text-secondary)]">
                        {formatDate(application.applicationSubmittedAt)}
                      </td>
                      <td className="tw-px-6 tw-py-4">
                        <StatusBadge 
                            variant={getStatusBadgeVariant(application.applicationStatus)} 
                            label={classifyStatus(application.applicationStatus)} 
                        />
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-text-right">
                        <div className="tw-flex tw-justify-end tw-gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openRoleModal(application)}>
                            Role
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => openApplicationDetails(application)}>
                            View
                          </Button>
                          {isPending && (
                            <>
                              <Button size="sm" variant="success" loading={isMutating} onClick={() => handleApprove(application._id)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="danger" loading={isMutating} onClick={() => handleReject(application._id)}>
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Application Details Modal */}
      <AnimatePresence>
        {showApplicationModal && selectedApplication && (
          <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center" role="dialog" aria-modal="true">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                {...{ className: "tw-absolute tw-inset-0 tw-bg-[var(--surface-overlay)] tw-backdrop-blur-sm" } as any}
                onClick={() => setShowApplicationModal(false)}
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                {...{ className: "tw-bg-[var(--surface-card)] tw-rounded-2xl tw-shadow-[var(--shadow-lg)] tw-border tw-border-[var(--border-color)] tw-w-full tw-max-w-3xl tw-max-h-[85vh] tw-overflow-hidden tw-relative tw-z-10 tw-flex tw-flex-col" } as any}
            >
              <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-[var(--border-color)] tw-px-6 tw-py-4 tw-bg-[var(--surface-secondary)]">
                <div>
                  <h3 className="tw-text-lg tw-font-semibold tw-text-[var(--text-primary)]">Application Details</h3>
                  <div className="tw-mt-1.5 tw-flex tw-items-center tw-gap-2">
                    <StatusBadge variant={getRoleBadgeVariant(getApplicationRole(selectedApplication))} label={`${getApplicationRole(selectedApplication).charAt(0).toUpperCase() + getApplicationRole(selectedApplication).slice(1)} Application`} />
                    <StatusBadge variant={getStatusBadgeVariant(selectedApplication.applicationStatus)} label={classifyStatus(selectedApplication.applicationStatus)} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplicationModal(false)}
                  className="tw-text-[var(--text-tertiary)] hover:tw-text-[var(--text-primary)] tw-p-1 tw-rounded-md hover:tw-bg-[var(--surface-hover)] tw-transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="tw-px-6 tw-py-6 tw-overflow-y-auto tw-space-y-6">
                <section className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-bg-[var(--surface-background)] tw-rounded-xl tw-p-4 tw-border tw-border-[var(--border-color)]">
                  <InfoBlock label="Name" value={`${selectedApplication.firstname} ${selectedApplication.lastname}`} />
                  <InfoBlock label="Email" value={selectedApplication.email} />
                  <InfoBlock label="Submitted" value={formatDate(selectedApplication.applicationSubmittedAt)} />
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

                <section className="tw-space-y-2 tw-border-t tw-border-[var(--border-color)] tw-pt-4">
                  <p className="tw-text-[11px] tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">{supportingDocumentLabel[getApplicationRole(selectedApplication)]}</p>
                  {getApplicationRole(selectedApplication) === 'mentee' && selectedApplication.applicationData?.corUrl && (
                    <a
                      href={selectedApplication.applicationData.corUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-primary hover:tw-text-primary/80"
                    >
                      View COR <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                  )}
                  {getApplicationRole(selectedApplication) === 'mentor' && selectedApplication.applicationData?.supportingDocumentUrl ? (
                    <a
                      href={selectedApplication.applicationData.supportingDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-primary hover:tw-text-primary/80"
                    >
                      View Document <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                  ) : getApplicationRole(selectedApplication) === 'mentor' ? (
                    <p className="tw-text-sm tw-text-[var(--text-secondary)]">No supporting document provided.</p>
                  ) : null}
                </section>
              </div>

              {classifyStatus(selectedApplication.applicationStatus) === 'pending' && (
                <div className="tw-px-6 tw-py-4 tw-border-t tw-border-[var(--border-color)] tw-bg-[var(--surface-secondary)] tw-flex tw-justify-end tw-gap-3">
                  <Button variant="danger" onClick={() => handleReject(selectedApplication._id)} disabled={isMutating} loading={isMutating}>
                    Reject
                  </Button>
                  <Button variant="success" onClick={() => handleApprove(selectedApplication._id)} disabled={isMutating} loading={isMutating}>
                    Approve
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role Update Modal */}
      <AnimatePresence>
        {showRoleModal && selectedUser && (
          <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center" role="dialog" aria-modal="true">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                {...{ className: "tw-absolute tw-inset-0 tw-bg-[var(--surface-overlay)] tw-backdrop-blur-sm" } as any}
                onClick={() => setShowRoleModal(false)}
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                {...{ className: "tw-bg-[var(--surface-card)] tw-rounded-xl tw-shadow-[var(--shadow-xl)] tw-border tw-border-[var(--border-color)] tw-w-full tw-max-w-md tw-p-6 tw-relative tw-z-10" } as any}
            >
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <h3 className="tw-text-lg tw-font-semibold tw-text-[var(--text-primary)]">Update User Role</h3>
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="tw-text-[var(--text-tertiary)] hover:tw-text-[var(--text-primary)] tw-p-1 tw-rounded-md hover:tw-bg-[var(--surface-hover)] tw-transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <p className="tw-text-sm tw-text-[var(--text-secondary)] tw-mb-4">
                Update the primary role for <span className="tw-font-medium tw-text-[var(--text-primary)]">{selectedUser.firstname} {selectedUser.lastname}</span>.
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function InfoBlock({ label, value }: { label: string; value: any }) {
  const resolvedValue = value === undefined || value === null || value === '' ? 'N/A' : value;

  return (
    <div>
      <p className="tw-text-[11px] tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">{label}</p>
      <p className="tw-text-sm tw-text-[var(--text-primary)] tw-mt-1">{resolvedValue}</p>
    </div>
  );
}

function InfoLink({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) {
    return (
      <div>
        <p className="tw-text-[11px] tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">{label}</p>
        <p className="tw-text-sm tw-text-[var(--text-secondary)] tw-mt-1">Not provided</p>
      </div>
    );
  }

  return (
    <div>
      <p className="tw-text-[11px] tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">{label}</p>
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-primary hover:tw-text-primary/80 tw-mt-1"
      >
        Visit Link <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      </a>
    </div>
  );
}

function RoleButton({ label, description, onClick, disabled }: { label: string; description: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="tw-w-full tw-text-left tw-border tw-border-[var(--border-color)] tw-bg-[var(--surface-background)] hover:tw-bg-[var(--surface-hover)] hover:tw-border-primary/30 tw-rounded-lg tw-px-4 tw-py-3 tw-transition-colors disabled:tw-opacity-60 disabled:hover:tw-border-[var(--border-color)] disabled:hover:tw-bg-[var(--surface-background)]"
    >
      <p className="tw-text-sm tw-font-semibold tw-text-[var(--text-primary)]">{label}</p>
      <p className="tw-text-xs tw-text-[var(--text-secondary)] tw-mt-1">{description}</p>
    </button>
  );
}
