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

const accountStatusClass: Record<string, string> = {
    active: 'tw-bg-emerald-100 tw-text-emerald-800',
    deactivated: 'tw-bg-amber-100 tw-text-amber-800',
    suspended: 'tw-bg-red-100 tw-text-red-700',
};

const applicationStatusClass: Record<string, string> = {
    approved: 'tw-bg-emerald-50 tw-text-emerald-700',
    pending: 'tw-bg-yellow-50 tw-text-yellow-800',
    not_submitted: 'tw-bg-yellow-50 tw-text-yellow-800',
    rejected: 'tw-bg-red-50 tw-text-red-700',
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
    if (!value) {
        return '—';
    }
    try {
        return new Date(value).toLocaleDateString();
    } catch {
        return '—';
    }
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return '—';
    }
    try {
        return new Date(value).toLocaleString();
    } catch {
        return '—';
    }
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
        if (!selectedUserId || !detailUserRole) {
            return null;
        }
        const base = { limit: 5, page: 1, sort: 'newest' as const };
        if (detailUserRole === 'mentor') {
            return { ...base, mentor: selectedUserId };
        }
        if (detailUserRole === 'mentee') {
            return { ...base, mentee: selectedUserId };
        }
        return null;
    }, [selectedUserId, detailUserRole]);

    const sessionQuery = useAdminSessions(sessionFilters ?? { limit: 5, page: 1 }, { enabled: Boolean(sessionFilters) });
    const userSessions = sessionQuery.data?.sessions ?? [];

    const showRelationshipInsights = detailUserRole === 'mentor' || detailUserRole === 'mentee';

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
        }, 400);
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
        if (!pendingAction) {
            return;
        }
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
            const message =
                (typeof error === 'object' && error && 'response' in error &&
                    (error as any).response?.data?.message) ||
                'Unable to complete the action.';
            setActionError(message);
        }
    };

    const handleFilterChange = <K extends keyof AdminUserFilters>(key: K, value: AdminUserFilters[K]) => {
        setFilters((prev) => {
            const next = { ...prev, [key]: value } as AdminUserFilters;
            if (key !== 'page') {
                next.page = 1;
            }
            return next;
        });
    };

    const resetFilters = () => {
        setFilters({ ...defaultFilters });
        setSearchInput('');
    };

    const filteredUsers = useMemo(() => users, [users]);

    const renderStatusBadge = (label: string, classMap: Record<string, string>) => {
        const normalized = label || 'unknown';
        const classes = classMap[normalized] || 'tw-bg-slate-100 tw-text-slate-700';
        return (
            <span className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium ${classes}`}>
                {normalized.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200">
            <div className="tw-px-6 tw-py-4 tw-border-b tw-border-gray-200">
                <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-3">
                    <div>
                        <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">User Management</h2>
                        <p className="tw-text-sm tw-text-gray-500">
                            Search and review every account. Approve new mentors, pause access, or follow-up on audit logs.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="tw-px-6 tw-py-4 tw-border-b tw-border-gray-200 tw-space-y-4">
                <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4">
                    <label className="tw-flex tw-flex-col tw-text-sm tw-text-gray-600 tw-flex-1">
                        <span className="tw-font-medium">Search</span>
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Name or email"
                            className="tw-mt-1 tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                        />
                    </label>
                    <label className="tw-flex tw-flex-col tw-text-sm tw-text-gray-600">
                        <span className="tw-font-medium">Role</span>
                        <select
                            value={filters.role}
                            onChange={(event) => handleFilterChange('role', event.target.value as AdminUserFilters['role'])}
                            className="tw-mt-1 tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                        >
                            <option value="all">All roles</option>
                            <option value="mentor">Mentors</option>
                            <option value="mentee">Mentees</option>
                            <option value="admin">Admins</option>
                        </select>
                    </label>
                    <label className="tw-flex tw-flex-col tw-text-sm tw-text-gray-600">
                        <span className="tw-font-medium">Account status</span>
                        <select
                            value={filters.accountStatus}
                            onChange={(event) =>
                                handleFilterChange('accountStatus', event.target.value as AdminUserFilters['accountStatus'])
                            }
                            className="tw-mt-1 tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                        >
                            <option value="all">All statuses</option>
                            <option value="active">Active</option>
                            <option value="deactivated">Deactivated</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </label>
                    <label className="tw-flex tw-flex-col tw-text-sm tw-text-gray-600">
                        <span className="tw-font-medium">Application status</span>
                        <select
                            value={filters.applicationStatus}
                            onChange={(event) =>
                                handleFilterChange(
                                    'applicationStatus',
                                    event.target.value as AdminUserFilters['applicationStatus']
                                )
                            }
                            className="tw-mt-1 tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                        >
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </label>
                </div>
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                    <button
                        type="button"
                        onClick={() => handleFilterChange('pendingOnly', !filters.pendingOnly)}
                        className={`tw-inline-flex tw-items-center tw-rounded-full tw-border tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium ${
                            filters.pendingOnly
                                ? 'tw-border-purple-600 tw-text-purple-700 tw-bg-purple-50'
                                : 'tw-border-gray-300 tw-text-gray-700'
                        }`}
                    >
                        Pending applications only
                    </button>
                    <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
                        <input
                            type="checkbox"
                            className="tw-rounded tw-border-gray-300 tw-text-purple-600 focus:tw-ring-purple-500"
                            checked={Boolean(filters.includeDeleted)}
                            onChange={(event) => handleFilterChange('includeDeleted', event.target.checked)}
                        />
                        Include deleted
                    </label>
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="tw-text-sm tw-font-medium tw-text-gray-600 hover:tw-text-gray-800"
                    >
                        Reset filters
                    </button>
                </div>
            </div>

            {isError && (
                <div className="tw-px-6 tw-py-4 tw-text-red-700 tw-bg-red-50">
                    Unable to load users at the moment. Please try refreshing.
                </div>
            )}

            {isLoading ? (
                <div className="tw-flex tw-items-center tw-justify-center tw-p-12">
                    <div className="tw-h-10 tw-w-10 tw-animate-spin tw-rounded-full tw-border-b-2 tw-border-purple-500" />
                </div>
            ) : (
                <div className="tw-overflow-x-auto">
                    <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
                        <thead className="tw-bg-gray-50">
                            <tr>
                                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">User</th>
                                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">Role</th>
                                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">
                                    Account
                                </th>
                                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">
                                    Application
                                </th>
                                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">
                                    Last action
                                </th>
                                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">
                                    Submitted
                                </th>
                                <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="tw-divide-y tw-divide-gray-100 tw-bg-white">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:tw-bg-gray-50">
                                    <td className="tw-px-6 tw-py-4">
                                        <div className="tw-text-sm tw-font-semibold tw-text-gray-900">
                                            {user.displayName || `${user.firstname} ${user.lastname}`}
                                        </div>
                                        <div className="tw-text-sm tw-text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="tw-px-6 tw-py-4">
                                        <span className="tw-text-sm tw-font-medium tw-text-gray-800">
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                    </td>
                                    <td className="tw-px-6 tw-py-4">{renderStatusBadge(user.accountStatus, accountStatusClass)}</td>
                                    <td className="tw-px-6 tw-py-4">
                                        {renderStatusBadge(user.applicationStatus, applicationStatusClass)}
                                    </td>
                                    <td className="tw-px-6 tw-py-4">
                                        {user.lastAction ? (
                                            <div>
                                                <p className="tw-text-sm tw-font-medium tw-text-gray-800">
                                                    {user.lastAction.action.replace('_', ' ')}
                                                </p>
                                                <p className="tw-text-xs tw-text-gray-500">{formatDate(user.lastAction.createdAt)}</p>
                                            </div>
                                        ) : (
                                            <span className="tw-text-sm tw-text-gray-400">No actions</span>
                                        )}
                                    </td>
                                    <td className="tw-px-6 tw-py-4">
                                        <span className="tw-text-sm tw-text-gray-700">{formatDate(user.submittedAt)}</span>
                                    </td>
                                    <td className="tw-px-6 tw-py-4">
                                        <div className="tw-flex tw-flex-wrap tw-gap-3 tw-text-sm tw-font-medium">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedUserId(user.id)}
                                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-bg-blue-50 tw-text-blue-700 hover:tw-bg-blue-100 tw-transition-colors"
                                            >
                                                Inspect
                                            </button>
                                            {user.hasPendingApplication && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => openActionModal('approve', user)}
                                                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-bg-emerald-50 tw-text-emerald-700 hover:tw-bg-emerald-100 tw-transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openActionModal('reject', user)}
                                                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-bg-red-50 tw-text-red-700 hover:tw-bg-red-100 tw-transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {user.accountStatus === 'active' && (
                                                <button
                                                    type="button"
                                                    onClick={() => openActionModal('deactivate', user)}
                                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-bg-amber-50 tw-text-amber-700 hover:tw-bg-amber-100 tw-transition-colors"
                                                >
                                                    Deactivate
                                                </button>
                                            )}
                                            {user.accountStatus !== 'active' && (
                                                <button
                                                    type="button"
                                                    onClick={() => openActionModal('reactivate', user)}
                                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-bg-emerald-50 tw-text-emerald-700 hover:tw-bg-emerald-100 tw-transition-colors"
                                                >
                                                    Reactivate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && !isError && (
                        <div className="tw-text-center tw-py-12">
                            <p className="tw-text-gray-600 tw-text-base">No users match the current filters.</p>
                            <p className="tw-text-gray-400 tw-text-sm">Try adjusting the filters or clearing the search.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-border-t tw-border-gray-200 tw-px-6 tw-py-4">
                <div className="tw-text-sm tw-text-gray-600">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="tw-flex tw-items-center tw-gap-2">
                    <button
                        type="button"
                        onClick={() => handleFilterChange('page', Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-gray-700 disabled:tw-opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        onClick={() => handleFilterChange('page', Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-gray-700 disabled:tw-opacity-50"
                    >
                        Next
                    </button>
                    <select
                        value={filters.limit}
                        onChange={(event) => handleFilterChange('limit', Number(event.target.value))}
                        className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-1.5 tw-text-sm"
                    >
                        {[10, 20, 50].map((value) => (
                            <option key={value} value={value}>
                                {value} / page
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedUserId && (
                <div className="tw-fixed tw-inset-0 tw-z-40 tw-bg-black tw-bg-opacity-40 tw-flex tw-items-center tw-justify-center" role="dialog" aria-modal="true">
                    <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-3xl tw-max-h-[90vh] tw-overflow-hidden">
                        <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-gray-200 tw-px-6 tw-py-4">
                            <div>
                                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">User details</h3>
                                <p className="tw-text-sm tw-text-gray-500">Recent admin actions and profile highlights.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedUserId(null)}
                                className="tw-text-gray-500 hover:tw-text-gray-700"
                                aria-label="Close details"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-0 tw-max-h-[80vh]">
                            <div className="tw-px-6 tw-py-4 tw-space-y-3 tw-overflow-y-auto">
                                {detailQuery.isLoading ? (
                                    <div className="tw-flex tw-justify-center tw-p-6">
                                        <div className="tw-h-8 tw-w-8 tw-animate-spin tw-rounded-full tw-border-b-2 tw-border-purple-500" />
                                    </div>
                                ) : detailQuery.data ? (
                                    <>
                                        <div>
                                            <p className="tw-text-sm tw-text-gray-500">Name</p>
                                            <p className="tw-text-base tw-font-semibold tw-text-gray-900">
                                                {detailQuery.data.user.displayName ||
                                                    `${detailQuery.data.user.firstname} ${detailQuery.data.user.lastname}`}
                                            </p>
                                            <p className="tw-text-sm tw-text-gray-500">{detailQuery.data.user.email}</p>
                                        </div>
                                        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                                            <div>
                                                <p className="tw-text-xs tw-text-gray-500">Account</p>
                                                {renderStatusBadge(detailQuery.data.user.accountStatus, accountStatusClass)}
                                            </div>
                                            <div>
                                                <p className="tw-text-xs tw-text-gray-500">Application</p>
                                                {renderStatusBadge(detailQuery.data.user.applicationStatus, applicationStatusClass)}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="tw-text-xs tw-text-gray-500">Submitted</p>
                                            <p className="tw-text-sm tw-text-gray-800">{formatDate(detailQuery.data.user.submittedAt)}</p>
                                        </div>
                                        <div>
                                            <p className="tw-text-xs tw-text-gray-500">Profile summary</p>
                                            <p className="tw-text-sm tw-text-gray-700">
                                                {(detailQuery.data.user.profile?.bio as string) || 'No bio provided.'}
                                            </p>
                                        </div>
                                        {showRelationshipInsights && (
                                            <div className="tw-space-y-4">
                                                <div className="tw-rounded-2xl tw-border tw-border-gray-100 tw-bg-white tw-p-4">
                                                    <div className="tw-flex tw-items-center tw-justify-between">
                                                        <div>
                                                            <p className="tw-text-xs tw-font-semibold tw-text-gray-500">Sessions</p>
                                                            <p className="tw-text-sm tw-text-gray-700">
                                                                {detailUserRole === 'mentor'
                                                                    ? 'Recent mentee sessions'
                                                                    : 'Sessions with mentor'}
                                                            </p>
                                                        </div>
                                                        <span className="tw-text-xs tw-font-semibold tw-text-gray-500">
                                                            {sessionQuery.isFetching ? 'Loading…' : `${userSessions.length} captured`}
                                                        </span>
                                                    </div>
                                                    {sessionQuery.isLoading ? (
                                                        <div className="tw-flex tw-justify-center tw-py-6">
                                                            <div className="tw-h-6 tw-w-6 tw-animate-spin tw-rounded-full tw-border-b-2 tw-border-purple-500" />
                                                        </div>
                                                    ) : userSessions.length ? (
                                                        <ul className="tw-mt-3 tw-space-y-3">
                                                            {userSessions.map((session) => {
                                                                const counterpart = detailUserRole === 'mentor' ? session.mentee : session.mentor;
                                                                return (
                                                                    <li
                                                                        key={session.id}
                                                                        className="tw-rounded-xl tw-border tw-border-gray-100 tw-p-3"
                                                                    >
                                                                        <div className="tw-flex tw-items-start tw-justify-between">
                                                                            <div>
                                                                                <p className="tw-text-sm tw-font-semibold tw-text-gray-900">
                                                                                    {session.subject || 'Mentoring session'}
                                                                                </p>
                                                                                <p className="tw-text-xs tw-text-gray-500">
                                                                                    {formatDateTime(session.date)}
                                                                                </p>
                                                                            </div>
                                                                            <span className="tw-rounded-full tw-bg-gray-100 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-text-gray-700">
                                                                                {session.status}
                                                                            </span>
                                                                        </div>
                                                                        <div className="tw-mt-2">
                                                                            <p className="tw-text-xs tw-text-gray-500">
                                                                                {detailUserRole === 'mentor' ? 'Mentee' : 'Mentor'}
                                                                            </p>
                                                                            <p className="tw-text-sm tw-font-medium tw-text-gray-900">
                                                                                {counterpart?.name || (session.isGroup ? 'Group session' : 'Unassigned')}
                                                                            </p>
                                                                            {counterpart?.email && (
                                                                                <p className="tw-text-xs tw-text-gray-500">{counterpart.email}</p>
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    ) : (
                                                        <p className="tw-mt-3 tw-text-sm tw-text-gray-500">No sessions recorded yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="tw-text-sm tw-text-red-600">Unable to load user profile.</p>
                                )}
                            </div>
                            <div className="tw-border-t lg:tw-border-l tw-border-gray-200 tw-bg-gray-50 tw-px-6 tw-py-4 tw-overflow-y-auto">
                                <h4 className="tw-text-sm tw-font-semibold tw-text-gray-800">Recent admin actions</h4>
                                {detailQuery.data?.actions?.length ? (
                                    <ul className="tw-mt-3 tw-space-y-3">
                                        {detailQuery.data.actions.map((action) => (
                                            <li key={action.id} className="tw-rounded-xl tw-bg-white tw-p-3 tw-shadow-sm tw-border tw-border-gray-100">
                                                <p className="tw-text-sm tw-font-medium tw-text-gray-900">
                                                    {action.action.replace('_', ' ')}
                                                </p>
                                                {action.reason && (
                                                    <p className="tw-text-sm tw-text-gray-600 tw-mt-1">{action.reason}</p>
                                                )}
                                                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">{formatDate(action.createdAt)}</p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="tw-text-sm tw-text-gray-500 tw-mt-3">No admin actions yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {pendingAction && (
                <div className="tw-fixed tw-inset-0 tw-z-50 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center" role="dialog" aria-modal="true">
                    <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-p-6">
                        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">{actionLabels[pendingAction.type]}</h3>
                        <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                            Target user: {pendingAction.user.displayName || `${pendingAction.user.firstname} ${pendingAction.user.lastname}`}
                        </p>
                        {requiresReason(pendingAction.type) && (
                            <label className="tw-block tw-mt-4">
                                <span className="tw-text-sm tw-font-medium tw-text-gray-700">Reason</span>
                                <textarea
                                    value={actionReason}
                                    onChange={(event) => setActionReason(event.target.value)}
                                    rows={4}
                                    className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                                />
                            </label>
                        )}
                        {actionError && <p className="tw-mt-2 tw-text-sm tw-text-red-600">{actionError}</p>}
                        <div className="tw-mt-6 tw-flex tw-justify-end tw-gap-3">
                            <button
                                type="button"
                                onClick={closeActionModal}
                                className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                                disabled={actionMutation.isPending}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleActionSubmit}
                                className={`tw-rounded-lg tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white ${
                                    pendingAction.type === 'delete'
                                        ? 'tw-bg-red-600 hover:tw-bg-red-700'
                                        : 'tw-bg-purple-600 hover:tw-bg-purple-700'
                                }`}
                                disabled={actionMutation.isPending}
                            >
                                {actionMutation.isPending ? 'Processing…' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagementPanel;
