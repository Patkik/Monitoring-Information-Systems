import React, { useEffect, useMemo, useState } from 'react';
import {
    AdminActionType,
    AdminUserFilters,
    AdminUserListItem,
    useAdminUserAction,
    useAdminUserDetails,
    useAdminUsers,
} from '../../hooks/useAdminUsers';
import { useToast } from '../../hooks/useToast';
import { useAdminSessions } from '../../hooks/useAdminSessions';
import { Card, Button, StatusBadge, LoadingSpinner, EmptyState } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

const defaultFilters: AdminUserFilters = {
    role: 'all',
    accountStatus: 'all',
    applicationStatus: 'all',
    pendingOnly: false,
    includeDeleted: false,
    search: '',
    page: 1,
    limit: 20,
};

// Map backend statuses to StatusBadge variants
const getAccountStatusVariant = (status: string): "success" | "warning" | "error" | "info" | "neutral" => {
    switch (status) {
        case 'active': return 'success';
        case 'deactivated': return 'warning';
        case 'suspended': return 'error';
        default: return 'neutral';
    }
};

const getApplicationStatusVariant = (status: string): "success" | "warning" | "error" | "info" | "neutral" => {
    switch (status) {
        case 'approved': return 'success';
        case 'pending': return 'warning';
        case 'not_submitted': return 'warning';
        case 'rejected': return 'error';
        default: return 'neutral';
    }
};

const actionLabels: Record<AdminActionType, string> = {
    approve: 'Approve Access',
    reject: 'Reject Application',
    deactivate: 'Deactivate Account',
    reactivate: 'Reactivate Account',
    delete: 'Remove Account',
};

const requiresReason = (action: AdminActionType) => action === 'reject' || action === 'deactivate' || action === 'delete';

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    try { return new Date(value).toLocaleDateString(); } catch { return '—'; }
};

const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    try { return new Date(value).toLocaleString(); } catch { return '—'; }
};

const AdminUserManagementPanel: React.FC = () => {
    const [filters, setFilters] = useState<AdminUserFilters>(defaultFilters);
    const [searchInput, setSearchInput] = useState(defaultFilters.search);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<{ type: AdminActionType; user: AdminUserListItem } | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [actionError, setActionError] = useState('');
    
    const { data, isLoading, isError, refetch } = useAdminUsers(filters);
    const detailQuery = useAdminUserDetails(selectedUserId);
    const actionMutation = useAdminUserAction();
    const { showToast } = useToast();
    const detailUserRole = detailQuery.data?.user.role;

    const sessionFilters = useMemo(() => {
        if (!selectedUserId || !detailUserRole) return null;
        const base = { limit: 5, page: 1, sort: 'newest' as const };
        if (detailUserRole === 'mentor') return { ...base, mentor: selectedUserId };
        if (detailUserRole === 'mentee') return { ...base, mentee: selectedUserId };
        return null;
    }, [selectedUserId, detailUserRole]);

    const sessionQuery = useAdminSessions(sessionFilters ?? { limit: 5, page: 1 }, { enabled: Boolean(sessionFilters) });
    const userSessions = sessionQuery.data?.sessions ?? [];
    const showRelationshipInsights = detailUserRole === 'mentor' || detailUserRole === 'mentee';

    useEffect(() => {
        const timer = window.setTimeout(() => setFilters((prev) => ({ ...prev, search: searchInput, page: 1 })), 400);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    const users = data?.users ?? [];
    const pagination = data?.meta?.pagination;
    const totalPages = pagination?.pages ?? 1;
    const currentPage = pagination?.page ?? filters.page;

    const openActionModal = (type: AdminActionType, user: AdminUserListItem) => {
        setPendingAction({ type, user });
        setActionReason('');
        setActionError('');
    };

    const closeActionModal = () => {
        setPendingAction(null);
        setActionReason('');
        setActionError('');
    };

    const handleActionSubmit = async () => {
        if (!pendingAction) return;
        if (requiresReason(pendingAction.type) && !actionReason.trim()) {
            setActionError('Please provide a short reason.');
            return;
        }

        try {
            await actionMutation.mutateAsync({
                userId: pendingAction.user.id,
                action: pendingAction.type,
                reason: actionReason.trim() || undefined,
            });
            showToast({ message: `${actionLabels[pendingAction.type]} succeeded.`, variant: 'success' });
            closeActionModal();
        } catch (error: unknown) {
            const message = (typeof error === 'object' && error && 'response' in error && (error as any).response?.data?.message) || 'Unable to complete the action.';
            setActionError(message);
        }
    };

    const handleFilterChange = <K extends keyof AdminUserFilters>(key: K, value: AdminUserFilters[K]) => {
        setFilters((prev) => {
            const next = { ...prev, [key]: value } as AdminUserFilters;
            if (key !== 'page') next.page = 1;
            return next;
        });
    };

    const resetFilters = () => {
        setFilters({ ...defaultFilters });
        setSearchInput('');
    };

    const filteredUsers = useMemo(() => users, [users]);

    return (
        <Card className="tw-p-0 tw-overflow-hidden tw-flex tw-flex-col tw-border-[var(--border-color)]">
            <div className="tw-px-6 tw-py-4 tw-border-b tw-border-[var(--border-color)] tw-bg-[var(--surface-secondary)]">
                <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-3">
                    <div>
                        <h2 className="tw-text-base tw-font-semibold tw-text-[var(--text-primary)]">User Directory</h2>
                        <p className="tw-text-sm tw-text-[var(--text-secondary)] tw-mt-0.5">
                            Search and review every account in the platform.
                        </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="tw-px-6 tw-py-4 tw-border-b tw-border-[var(--border-color)] tw-space-y-4 tw-bg-[var(--surface-card)]">
                <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4">
                    <label className="tw-flex tw-flex-col tw-text-sm tw-text-[var(--text-secondary)] tw-flex-1">
                        <span className="tw-font-medium tw-mb-1">Search</span>
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Name or email"
                            className="tw-w-full tw-bg-[var(--surface-background)] tw-border tw-border-[var(--border-color)] tw-rounded-md tw-px-3 tw-py-2 tw-text-[var(--text-primary)] focus:tw-ring-2 focus:tw-ring-primary/50 focus:tw-border-primary tw-outline-none tw-transition-all placeholder:tw-text-[var(--text-muted)]"
                        />
                    </label>
                    <label className="tw-flex tw-flex-col tw-text-sm tw-text-[var(--text-secondary)]">
                        <span className="tw-font-medium tw-mb-1">Role</span>
                        <select
                            value={filters.role}
                            onChange={(event) => handleFilterChange('role', event.target.value as AdminUserFilters['role'])}
                            className="tw-bg-[var(--surface-background)] tw-border tw-border-[var(--border-color)] tw-rounded-md tw-px-3 tw-py-2 tw-text-[var(--text-primary)] focus:tw-ring-2 focus:tw-ring-primary/50 focus:tw-border-primary tw-outline-none"
                        >
                            <option value="all">All roles</option>
                            <option value="mentor">Mentors</option>
                            <option value="mentee">Mentees</option>
                            <option value="admin">Admins</option>
                        </select>
                    </label>
                    <label className="tw-flex tw-flex-col tw-text-sm tw-text-[var(--text-secondary)]">
                        <span className="tw-font-medium tw-mb-1">Account status</span>
                        <select
                            value={filters.accountStatus}
                            onChange={(event) => handleFilterChange('accountStatus', event.target.value as AdminUserFilters['accountStatus'])}
                            className="tw-bg-[var(--surface-background)] tw-border tw-border-[var(--border-color)] tw-rounded-md tw-px-3 tw-py-2 tw-text-[var(--text-primary)] focus:tw-ring-2 focus:tw-ring-primary/50 focus:tw-border-primary tw-outline-none"
                        >
                            <option value="all">All statuses</option>
                            <option value="active">Active</option>
                            <option value="deactivated">Deactivated</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </label>
                    <label className="tw-flex tw-flex-col tw-text-sm tw-text-[var(--text-secondary)]">
                        <span className="tw-font-medium tw-mb-1">Application status</span>
                        <select
                            value={filters.applicationStatus}
                            onChange={(event) => handleFilterChange('applicationStatus', event.target.value as AdminUserFilters['applicationStatus'])}
                            className="tw-bg-[var(--surface-background)] tw-border tw-border-[var(--border-color)] tw-rounded-md tw-px-3 tw-py-2 tw-text-[var(--text-primary)] focus:tw-ring-2 focus:tw-ring-primary/50 focus:tw-border-primary tw-outline-none"
                        >
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </label>
                </div>
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
                    <button
                        type="button"
                        onClick={() => handleFilterChange('pendingOnly', !filters.pendingOnly)}
                        className={`tw-inline-flex tw-items-center tw-rounded-full tw-border tw-px-3 tw-py-1 tw-text-[13px] tw-font-medium tw-transition-colors ${
                            filters.pendingOnly
                                ? 'tw-border-primary tw-text-primary tw-bg-primary/10'
                                : 'tw-border-[var(--border-color)] tw-text-[var(--text-secondary)] hover:tw-bg-[var(--surface-hover)]'
                        }`}
                    >
                        Pending applications only
                    </button>
                    <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-[var(--text-secondary)] tw-cursor-pointer">
                        <input
                            type="checkbox"
                            className="tw-rounded tw-border-[var(--border-color)] tw-text-primary focus:tw-ring-primary"
                            checked={Boolean(filters.includeDeleted)}
                            onChange={(event) => handleFilterChange('includeDeleted', event.target.checked)}
                        />
                        Include deleted
                    </label>
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="tw-text-[13px] tw-font-medium tw-text-[var(--text-tertiary)] hover:tw-text-[var(--text-primary)] tw-transition-colors tw-ml-auto"
                    >
                        Reset filters
                    </button>
                </div>
            </div>

            {isError && (
                <div className="tw-px-6 tw-py-4 tw-text-red-600 dark:tw-text-red-400 tw-bg-red-50 dark:tw-bg-red-900/20 tw-text-sm">
                    Unable to load users at the moment. Please try refreshing.
                </div>
            )}

            {isLoading ? (
                <div className="tw-flex tw-items-center tw-justify-center tw-p-12">
                    <LoadingSpinner label="Loading users..." size="lg" />
                </div>
            ) : (
                <div className="tw-overflow-x-auto">
                    <table className="tw-min-w-full tw-divide-y tw-divide-[var(--border-color)]">
                        <thead className="tw-bg-[var(--surface-secondary)]">
                            <tr>
                                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">User</th>
                                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Role</th>
                                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Account</th>
                                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Application</th>
                                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Last action</th>
                                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Submitted</th>
                                <th className="tw-px-6 tw-py-3.5 tw-text-right tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="tw-divide-y tw-divide-[var(--border-color)] tw-bg-[var(--surface-card)]">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <EmptyState title="No users found" description="No users match your current filter criteria." />
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:tw-bg-[var(--surface-hover)] tw-transition-colors">
                                        <td className="tw-px-6 tw-py-4">
                                            <div className="tw-text-sm tw-font-semibold tw-text-[var(--text-primary)]">
                                                {user.displayName || `${user.firstname} ${user.lastname}`}
                                            </div>
                                            <div className="tw-text-[13px] tw-text-[var(--text-tertiary)] tw-mt-0.5">{user.email}</div>
                                        </td>
                                        <td className="tw-px-6 tw-py-4">
                                            <span className="tw-text-sm tw-font-medium tw-text-[var(--text-secondary)]">
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </td>
                                        <td className="tw-px-6 tw-py-4">
                                            <StatusBadge 
                                                variant={getAccountStatusVariant(user.accountStatus)} 
                                                label={user.accountStatus.replace('_', ' ')} 
                                            />
                                        </td>
                                        <td className="tw-px-6 tw-py-4">
                                            <StatusBadge 
                                                variant={getApplicationStatusVariant(user.applicationStatus)} 
                                                label={user.applicationStatus.replace('_', ' ')} 
                                            />
                                        </td>
                                        <td className="tw-px-6 tw-py-4">
                                            {user.lastAction ? (
                                                <div>
                                                    <p className="tw-text-[13px] tw-font-medium tw-text-[var(--text-secondary)]">
                                                        {user.lastAction.action.replace('_', ' ')}
                                                    </p>
                                                    <p className="tw-text-[11px] tw-text-[var(--text-tertiary)] tw-mt-0.5">{formatDate(user.lastAction.createdAt)}</p>
                                                </div>
                                            ) : (
                                                <span className="tw-text-sm tw-text-[var(--text-muted)]">—</span>
                                            )}
                                        </td>
                                        <td className="tw-px-6 tw-py-4">
                                            <span className="tw-text-[13px] tw-text-[var(--text-secondary)]">{formatDate(user.submittedAt)}</span>
                                        </td>
                                        <td className="tw-px-6 tw-py-4 tw-text-right">
                                            <div className="tw-flex tw-justify-end tw-gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => setSelectedUserId(user.id)}>
                                                    View
                                                </Button>
                                                {user.hasPendingApplication && (
                                                    <Button size="sm" onClick={() => openActionModal('approve', user)}>
                                                        Approve
                                                    </Button>
                                                )}
                                                {user.accountStatus === 'active' && (
                                                    <Button size="sm" variant="danger" onClick={() => openActionModal('deactivate', user)}>
                                                        Deactivate
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-border-t tw-border-[var(--border-color)] tw-px-6 tw-py-4 tw-bg-[var(--surface-secondary)]">
                <div className="tw-text-sm tw-text-[var(--text-secondary)]">
                    Page <span className="tw-font-medium">{currentPage}</span> of <span className="tw-font-medium">{totalPages}</span>
                </div>
                <div className="tw-flex tw-items-center tw-gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleFilterChange('page', Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                    >
                        Previous
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleFilterChange('page', Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                    </Button>
                    <select
                        aria-label="Rows per page"
                        value={filters.limit}
                        onChange={(event) => handleFilterChange('limit', Number(event.target.value))}
                        className="tw-bg-[var(--surface-background)] tw-border tw-border-[var(--border-color)] tw-rounded-md tw-px-2 tw-py-1.5 tw-text-sm tw-text-[var(--text-primary)] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50"
                    >
                        {[10, 20, 50].map((value) => (
                            <option key={value} value={value}>{value} / page</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Inspect Modal */}
            <AnimatePresence>
                {selectedUserId && (
                    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center" role="dialog" aria-modal="true">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            {...{ className: "tw-absolute tw-inset-0 tw-bg-[var(--surface-overlay)] tw-backdrop-blur-sm" } as any}
                            onClick={() => setSelectedUserId(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            {...{ className: "tw-bg-[var(--surface-card)] tw-rounded-2xl tw-shadow-[var(--shadow-lg)] tw-border tw-border-[var(--border-color)] tw-w-full tw-max-w-4xl tw-max-h-[90vh] tw-overflow-hidden tw-relative tw-z-10 tw-flex tw-flex-col" } as any}
                        >
                            <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-[var(--border-color)] tw-px-6 tw-py-4 tw-bg-[var(--surface-secondary)]">
                                <div>
                                    <h3 className="tw-text-lg tw-font-semibold tw-text-[var(--text-primary)]">User Details</h3>
                                    <p className="tw-text-sm tw-text-[var(--text-secondary)] tw-mt-0.5">Profile, sessions, and audit trail.</p>
                                </div>
                                <button
                                    onClick={() => setSelectedUserId(null)}
                                    className="tw-text-[var(--text-tertiary)] hover:tw-text-[var(--text-primary)] tw-p-1 tw-rounded-md hover:tw-bg-[var(--surface-hover)] tw-transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-flex-1 tw-overflow-hidden">
                                {/* Left Col - Profile Details */}
                                <div className="tw-col-span-2 tw-px-6 tw-py-6 tw-overflow-y-auto tw-space-y-6">
                                    {detailQuery.isLoading ? (
                                        <div className="tw-flex tw-justify-center tw-py-12"><LoadingSpinner /></div>
                                    ) : detailQuery.data ? (
                                        <>
                                            <div className="tw-flex tw-items-start tw-justify-between">
                                                <div>
                                                    <h4 className="tw-text-xl tw-font-bold tw-text-[var(--text-primary)]">
                                                        {detailQuery.data.user.displayName || `${detailQuery.data.user.firstname} ${detailQuery.data.user.lastname}`}
                                                    </h4>
                                                    <p className="tw-text-sm tw-text-[var(--text-secondary)] tw-mt-1">{detailQuery.data.user.email}</p>
                                                </div>
                                                <div className="tw-flex tw-gap-2">
                                                    <StatusBadge variant={getAccountStatusVariant(detailQuery.data.user.accountStatus)} label={detailQuery.data.user.accountStatus} />
                                                    <StatusBadge variant={getApplicationStatusVariant(detailQuery.data.user.applicationStatus)} label={detailQuery.data.user.applicationStatus} />
                                                </div>
                                            </div>

                                            <div className="tw-bg-[var(--surface-secondary)] tw-rounded-xl tw-p-4 tw-border tw-border-[var(--border-color)]">
                                                <p className="tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider tw-mb-2">Bio / Summary</p>
                                                <p className="tw-text-sm tw-text-[var(--text-secondary)] tw-leading-relaxed">
                                                    {(detailQuery.data.user.profile?.bio as string) || 'No bio provided.'}
                                                </p>
                                            </div>

                                            {showRelationshipInsights && (
                                                <div className="tw-space-y-3">
                                                    <div className="tw-flex tw-items-center tw-justify-between tw-pb-2 tw-border-b tw-border-[var(--border-color)]">
                                                        <h4 className="tw-text-[15px] tw-font-semibold tw-text-[var(--text-primary)]">Mentorship Sessions</h4>
                                                        <span className="tw-text-xs tw-font-medium tw-bg-[var(--surface-active)] tw-text-primary tw-px-2 tw-py-1 tw-rounded-full">
                                                            {sessionQuery.isFetching ? '...' : userSessions.length} total
                                                        </span>
                                                    </div>
                                                    
                                                    {sessionQuery.isLoading ? (
                                                        <div className="tw-flex tw-justify-center tw-py-6"><LoadingSpinner /></div>
                                                    ) : userSessions.length > 0 ? (
                                                        <div className="tw-space-y-3">
                                                            {userSessions.map((session) => {
                                                                const counterpart = detailUserRole === 'mentor' ? session.mentee : session.mentor;
                                                                return (
                                                                    <div key={session.id} className="tw-bg-[var(--surface-background)] tw-rounded-xl tw-border tw-border-[var(--border-color)] tw-p-4 tw-shadow-sm">
                                                                        <div className="tw-flex tw-items-start tw-justify-between">
                                                                            <div>
                                                                                <p className="tw-text-sm tw-font-semibold tw-text-[var(--text-primary)]">{session.subject || 'Mentoring session'}</p>
                                                                                <p className="tw-text-xs tw-text-[var(--text-tertiary)] tw-mt-0.5">{formatDateTime(session.date)}</p>
                                                                            </div>
                                                                            <span className="tw-bg-[var(--surface-secondary)] tw-text-[var(--text-secondary)] tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium">{session.status}</span>
                                                                        </div>
                                                                        <div className="tw-mt-3 tw-pt-3 tw-border-t tw-border-[var(--border-color)]">
                                                                            <p className="tw-text-[11px] tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">{detailUserRole === 'mentor' ? 'Mentee' : 'Mentor'}</p>
                                                                            <p className="tw-text-sm tw-text-[var(--text-primary)] tw-mt-1">{counterpart?.name || (session.isGroup ? 'Group session' : 'Unassigned')}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <EmptyState title="No sessions" description="This user hasn't participated in any sessions yet." />
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <EmptyState title="Error" description="Unable to load user profile." />
                                    )}
                                </div>
                                
                                {/* Right Col - Audit Log */}
                                <div className="tw-border-t lg:tw-border-t-0 lg:tw-border-l tw-border-[var(--border-color)] tw-bg-[var(--surface-secondary)] tw-px-5 tw-py-6 tw-overflow-y-auto">
                                    <h4 className="tw-text-[13px] tw-font-semibold tw-text-[var(--text-primary)] tw-uppercase tw-tracking-wider tw-mb-4">Audit Log</h4>
                                    {detailQuery.data?.actions?.length ? (
                                        <div className="tw-space-y-4 relative before:tw-absolute before:tw-inset-0 before:tw-ml-[9px] before:tw-w-px md:before:tw-mx-auto md:before:tw-translate-x-0 before:tw-h-full before:tw-bg-[var(--border-color)]">
                                            {detailQuery.data.actions.map((action) => (
                                                <div key={action.id} className="tw-relative tw-flex tw-items-center tw-gap-3">
                                                    <div className="tw-h-5 tw-w-5 tw-rounded-full tw-bg-[var(--surface-card)] tw-border-[3px] tw-border-primary tw-z-10" />
                                                    <div className="tw-flex-1 tw-bg-[var(--surface-card)] tw-rounded-lg tw-p-3 tw-shadow-sm tw-border tw-border-[var(--border-color)]">
                                                        <p className="tw-text-[13px] tw-font-medium tw-text-[var(--text-primary)]">{action.action.replace('_', ' ')}</p>
                                                        {action.reason && <p className="tw-text-xs tw-text-[var(--text-secondary)] tw-mt-1">{action.reason}</p>}
                                                        <p className="tw-text-[11px] tw-text-[var(--text-tertiary)] tw-mt-2">{formatDate(action.createdAt)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="tw-text-sm tw-text-[var(--text-tertiary)]">No administrative actions recorded.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Action Modal */}
            <AnimatePresence>
                {pendingAction && (
                    <div className="tw-fixed tw-inset-0 tw-z-[60] tw-flex tw-items-center tw-justify-center" role="dialog" aria-modal="true">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            {...{ className: "tw-absolute tw-inset-0 tw-bg-[var(--surface-overlay)] tw-backdrop-blur-sm" } as any}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            {...{ className: "tw-bg-[var(--surface-card)] tw-rounded-xl tw-shadow-[var(--shadow-xl)] tw-border tw-border-[var(--border-color)] tw-w-full tw-max-w-md tw-p-6 tw-relative tw-z-10" } as any}
                        >
                            <h3 className="tw-text-lg tw-font-semibold tw-text-[var(--text-primary)]">{actionLabels[pendingAction.type]}</h3>
                            <p className="tw-text-sm tw-text-[var(--text-secondary)] tw-mt-2">
                                You are about to perform this action on <strong>{pendingAction.user.displayName || `${pendingAction.user.firstname} ${pendingAction.user.lastname}`}</strong>.
                            </p>
                            
                            {requiresReason(pendingAction.type) && (
                                <div className="tw-mt-4">
                                    <label className="tw-block tw-text-sm tw-font-medium tw-text-[var(--text-secondary)] tw-mb-1">Reason for action</label>
                                    <textarea
                                        value={actionReason}
                                        onChange={(event) => setActionReason(event.target.value)}
                                        rows={3}
                                        placeholder="Please provide a brief explanation..."
                                        className="tw-w-full tw-bg-[var(--surface-background)] tw-border tw-border-[var(--border-color)] tw-rounded-lg tw-px-3 tw-py-2 tw-text-[var(--text-primary)] focus:tw-ring-2 focus:tw-ring-primary/50 focus:tw-border-primary tw-outline-none tw-resize-none"
                                    />
                                </div>
                            )}
                            
                            {actionError && (
                                <div className="tw-mt-4 tw-p-3 tw-bg-red-50 dark:tw-bg-red-900/20 tw-border tw-border-red-100 dark:tw-border-red-800 tw-rounded-lg">
                                    <p className="tw-text-sm tw-text-red-600 dark:tw-text-red-400">{actionError}</p>
                                </div>
                            )}
                            
                            <div className="tw-mt-6 tw-flex tw-justify-end tw-gap-3">
                                <Button variant="secondary" onClick={closeActionModal} disabled={actionMutation.isPending}>
                                    Cancel
                                </Button>
                                <Button 
                                    variant={pendingAction.type === 'delete' || pendingAction.type === 'deactivate' || pendingAction.type === 'reject' ? 'danger' : 'primary'}
                                    onClick={handleActionSubmit}
                                    loading={actionMutation.isPending}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Card>
    );
};

export default AdminUserManagementPanel;
