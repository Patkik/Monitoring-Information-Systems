import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    AdminNotificationLogEntry,
    AdminNotificationScope,
    useAdminNotificationLogs,
    useSendAdminNotification,
} from '../../hooks/useAdminNotifications';
import useAnnouncements, { ANNOUNCEMENTS_QUERY_KEY } from '../../shared/hooks/useAnnouncements';
import {
    AnnouncementDto,
    AnnouncementUpdatePayload,
    deleteAnnouncement as deleteAnnouncementRequest,
    updateAnnouncement as updateAnnouncementRequest,
} from '../../shared/services/announcementsService';

type AnnouncementEditForm = {
    title: string;
    summary: string;
    body: string;
    category: string;
    isFeatured: boolean;
    audience: AnnouncementDto['audience'];
    publishedAt: string;
};

const NOTIFICATION_TYPES = [
    { value: 'ADMIN_ANNOUNCEMENT', label: 'Announcement (default)' },
    { value: 'MATCH_UPDATE', label: 'Match / pairing update' },
    { value: 'SESSION_UPDATE', label: 'Session scheduling update' },
    { value: 'SYSTEM_ALERT', label: 'System alert' },
];

const DEFAULT_FORM_STATE = {
    title: '',
    message: '',
    type: NOTIFICATION_TYPES[0].value,
    scope: 'all' as AdminNotificationScope,
    roles: { mentor: true, mentee: true, admin: false },
    userIds: '',
    emails: '',
    channels: { inApp: true, email: false },
    publishToAnnouncements: true,
    summary: '',
    body: '',
    category: 'General',
    isFeatured: false,
};

const createInitialState = () => ({
    ...DEFAULT_FORM_STATE,
    roles: { ...DEFAULT_FORM_STATE.roles },
    channels: { ...DEFAULT_FORM_STATE.channels },
});

const formatDateTime = (isoDate: string) => {
    if (!isoDate) {
        return '—';
    }
    try {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(isoDate));
    } catch {
        return isoDate;
    }
};

const splitList = (value: string) =>
    value
        .split(/\r?\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean);

const describeScope = (log: AdminNotificationLogEntry) => {
    if (log.audienceScope === 'all') {
        return 'All users';
    }
    if (log.audienceScope === 'roles') {
        const roles = log.audienceFilters?.roles ?? [];
        if (!roles.length) {
            return 'Selected roles';
        }
        return roles.map((role) => role.charAt(0).toUpperCase() + role.slice(1)).join(', ');
    }
    const ids = log.audienceFilters?.userIds?.length ?? 0;
    const emails = log.audienceFilters?.emails?.length ?? 0;
    return `Custom (${ids} IDs, ${emails} emails)`;
};

const AdminAnnouncementCenter: React.FC = () => {
    const [formState, setFormState] = useState(createInitialState);
    const [dataPayload, setDataPayload] = useState('');
    const [dataError, setDataError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const { data: logs = [], isLoading: logsLoading, refetch: refetchLogs } = useAdminNotificationLogs();
    const sendNotification = useSendAdminNotification();
    const queryClient = useQueryClient();
    const {
        announcements,
        isLoading: announcementsLoading,
        isError: announcementsError,
        refetch: refetchAnnouncements,
    } = useAnnouncements();
    const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementDto | null>(null);
    const [editFormState, setEditFormState] = useState<AnnouncementEditForm | null>(null);
    const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const updateAnnouncementMutation = useMutation({
        mutationFn: ({ id, values }: { id: string; values: AnnouncementUpdatePayload }) =>
            updateAnnouncementRequest(id, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEY });
            refetchAnnouncements();
        },
    });

    const deleteAnnouncementMutation = useMutation({
        mutationFn: (id: string) => deleteAnnouncementRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEY });
            refetchAnnouncements();
        },
    });

    const isCustomScope = formState.scope === 'custom';
    const publishDisabled = isCustomScope;

    const toInputDateTime = (isoDate: string) => {
        if (!isoDate) {
            return '';
        }
        try {
            return new Date(isoDate).toISOString().slice(0, 16);
        } catch {
            return '';
        }
    };

    const startEditing = (announcement: AnnouncementDto) => {
        setEditingAnnouncement(announcement);
        setEditFormState({
            title: announcement.title,
            summary: announcement.summary ?? '',
            body: announcement.body,
            category: announcement.category,
            isFeatured: announcement.isFeatured,
            audience: announcement.audience,
            publishedAt: toInputDateTime(announcement.publishedAt),
        });
        setEditFeedback(null);
    };

    const cancelEditing = () => {
        setEditingAnnouncement(null);
        setEditFormState(null);
        setEditFeedback(null);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = event.target as HTMLInputElement;
        const { name, value, type, checked } = target;
        setFormState((prev) => {
            if (name === 'publishToAnnouncements') {
                return { ...prev, publishToAnnouncements: checked };
            }
            if (name.startsWith('roles.')) {
                const role = name.split('.')[1];
                return { ...prev, roles: { ...prev.roles, [role]: checked } };
            }
            if (name.startsWith('channels.')) {
                const channel = name.split('.')[1];
                return { ...prev, channels: { ...prev.channels, [channel]: checked } };
            }
            if (type === 'checkbox') {
                return { ...prev, [name]: checked };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleScopeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value as AdminNotificationScope;
        setFormState((prev) => ({
            ...prev,
            scope: value,
            publishToAnnouncements: value === 'custom' ? false : prev.publishToAnnouncements,
        }));
    };

    const handleEditInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const target = event.target as HTMLInputElement;
        const { name, value, type, checked } = target;
        setEditFormState((prev) => {
            if (!prev) {
                return prev;
            }
            if (type === 'checkbox') {
                return { ...prev, [name]: checked } as AnnouncementEditForm;
            }
            return { ...prev, [name]: value } as AnnouncementEditForm;
        });
    };

    const handleDeleteAnnouncement = async (announcement: AnnouncementDto) => {
        const confirmed = window.confirm(`Delete “${announcement.title}”? This cannot be undone.`);
        if (!confirmed) {
            return;
        }
        setEditFeedback(null);
        try {
            await deleteAnnouncementMutation.mutateAsync(announcement.id);
            if (editingAnnouncement?.id === announcement.id) {
                cancelEditing();
            }
            setEditFeedback({ type: 'success', message: 'Announcement deleted.' });
        } catch (error: any) {
            const apiMessage = error?.response?.data?.message;
            setEditFeedback({
                type: 'error',
                message: apiMessage || 'Unable to delete the announcement. Please try again.',
            });
        }
    };

    const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingAnnouncement || !editFormState) {
            return;
        }
        const trimmedTitle = editFormState.title.trim();
        const trimmedBody = editFormState.body.trim();
        if (!trimmedTitle || !trimmedBody) {
            setEditFeedback({ type: 'error', message: 'Title and body are required.' });
            return;
        }

        const payload: AnnouncementUpdatePayload = {
            title: trimmedTitle,
            body: trimmedBody,
            summary: editFormState.summary.trim() || undefined,
            category: editFormState.category.trim() || undefined,
            isFeatured: editFormState.isFeatured,
            audience: editFormState.audience,
            publishedAt: editFormState.publishedAt ? new Date(editFormState.publishedAt).toISOString() : undefined,
        };

        try {
            const updated = await updateAnnouncementMutation.mutateAsync({ id: editingAnnouncement.id, values: payload });
            setEditingAnnouncement(updated);
            setEditFormState({
                title: updated.title,
                summary: updated.summary ?? '',
                body: updated.body,
                category: updated.category,
                isFeatured: updated.isFeatured,
                audience: updated.audience,
                publishedAt: toInputDateTime(updated.publishedAt),
            });
            setEditFeedback({ type: 'success', message: 'Announcement updated.' });
        } catch (error: any) {
            const apiMessage = error?.response?.data?.message;
            setEditFeedback({
                type: 'error',
                message: apiMessage || 'Unable to update the announcement. Please try again.',
            });
        }
    };

    const parseDataPayload = () => {
        if (!dataPayload.trim()) {
            return {};
        }
        try {
            const parsed = JSON.parse(dataPayload);
            setDataError(null);
            return parsed;
        } catch (error) {
            setDataError('Context payload must be valid JSON.');
            throw error;
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFeedback(null);
        let parsedData: Record<string, unknown> = {};
        try {
            parsedData = parseDataPayload();
        } catch {
            return;
        }

        const selectedRoles = Object.entries(formState.roles)
            .filter(([, enabled]) => enabled)
            .map(([role]) => role);

        if (formState.scope === 'roles' && selectedRoles.length === 0) {
            setFeedback({ type: 'error', message: 'Select at least one role when targeting specific roles.' });
            return;
        }

        const customUserIds = formState.scope === 'custom' ? splitList(formState.userIds) : undefined;
        const customEmails = formState.scope === 'custom' ? splitList(formState.emails) : undefined;

        if (formState.scope === 'custom' && (!customUserIds?.length && !customEmails?.length)) {
            setFeedback({ type: 'error', message: 'Provide at least one user ID or email for custom announcements.' });
            return;
        }

        const payload = {
            title: formState.title.trim(),
            message: formState.message.trim(),
            type: formState.type,
            data: parsedData,
            audience: {
                scope: formState.scope,
                roles: formState.scope === 'roles' ? selectedRoles : undefined,
                userIds: customUserIds,
                emails: customEmails,
            },
            channels: formState.channels,
            publishOptions:
                formState.publishToAnnouncements && !publishDisabled
                    ? {
                          publishToAnnouncements: true,
                          title: formState.title,
                          body: formState.body || formState.message,
                          summary: formState.summary,
                          category: formState.category,
                          isFeatured: formState.isFeatured,
                      }
                    : { publishToAnnouncements: false },
        };

        if (!payload.title || !payload.message) {
            setFeedback({ type: 'error', message: 'Title and message are required.' });
            return;
        }

        try {
            const result = await sendNotification.mutateAsync(payload);
            setFeedback({ type: 'success', message: result?.message ?? 'Announcement sent successfully.' });
            setFormState(createInitialState());
            setDataPayload('');
            setDataError(null);
            refetchLogs();
            refetchAnnouncements();
        } catch (error: any) {
            const apiMessage = error?.response?.data?.message;
            setFeedback({
                type: 'error',
                message: apiMessage || 'Unable to send the announcement. Please try again.',
            });
        }
    };

    const trimmedLogs = useMemo(() => logs.slice(0, 20), [logs]);

    return (
        <div className="tw-space-y-6">
            <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-6">
                <section
                    className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-p-6 tw-shadow-sm"
                    aria-label="Compose admin announcement"
                >
                    <header className="tw-mb-6">
                        <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-indigo-500">Broadcast</p>
                        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Compose announcement</h2>
                        <p className="tw-text-sm tw-text-gray-600">
                            Share news with everyone or target mentors, mentees, admins, and custom recipients for match and session alerts.
                        </p>
                    </header>

                {feedback && (
                    <div
                        className={
                            feedback.type === 'success'
                                ? 'tw-bg-green-50 tw-border tw-border-green-200 tw-text-green-800 tw-rounded-lg tw-p-3 tw-mb-4'
                                : 'tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-800 tw-rounded-lg tw-p-3 tw-mb-4'
                        }
                        role="alert"
                        aria-live="assertive"
                    >
                        {feedback.message}
                    </div>
                )}

                <form className="tw-space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="title">
                            Title
                        </label>
                        <input
                            id="title"
                            name="title"
                            value={formState.title}
                            onChange={handleInputChange}
                            className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                            placeholder="Maintenance window on Saturday"
                            required
                        />
                    </div>

                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="message">
                            Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formState.message}
                            onChange={handleInputChange}
                            className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                            rows={4}
                            placeholder="Share the details mentees and mentors should see."
                            required
                        />
                    </div>

                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="type">
                                Announcement type
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={formState.type}
                                onChange={handleInputChange}
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                            >
                                {NOTIFICATION_TYPES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="category">
                                Announcement category
                            </label>
                            <input
                                id="category"
                                name="category"
                                value={formState.category}
                                onChange={handleInputChange}
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                                placeholder="General"
                                disabled={publishDisabled}
                            />
                        </div>
                    </div>

                    <fieldset>
                        <legend className="tw-text-sm tw-font-medium tw-text-gray-700">Audience</legend>
                        <div className="tw-mt-2 tw-space-y-2">
                            {['all', 'roles', 'custom'].map((value) => (
                                <label key={value} className="tw-flex tw-items-center tw-gap-3">
                                    <input
                                        type="radio"
                                        name="audience-scope"
                                        value={value}
                                        checked={formState.scope === value}
                                        onChange={handleScopeChange}
                                    />
                                    <span className="tw-text-sm tw-text-gray-800">
                                        {value === 'all' && 'All approved users'}
                                        {value === 'roles' && 'Specific roles (mentor, mentee, admin)'}
                                        {value === 'custom' && 'Custom list (IDs or emails)'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    {formState.scope === 'roles' && (
                        <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 tw-gap-3">
                            {Object.entries(formState.roles).map(([role, enabled]) => (
                                <label key={role} className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
                                    <input
                                        type="checkbox"
                                        name={`roles.${role}`}
                                        checked={enabled}
                                        onChange={handleInputChange}
                                    />
                                    <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {formState.scope === 'custom' && (
                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="userIds">
                                    User IDs (comma or line separated)
                                </label>
                                <textarea
                                    id="userIds"
                                    name="userIds"
                                    value={formState.userIds}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                                />
                            </div>
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="emails">
                                    Emails (comma or line separated)
                                </label>
                                <textarea
                                    id="emails"
                                    name="emails"
                                    value={formState.emails}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    <fieldset>
                        <legend className="tw-text-sm tw-font-medium tw-text-gray-700">Delivery channels</legend>
                        <div className="tw-flex tw-flex-wrap tw-gap-4 tw-mt-2">
                            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
                                <input
                                    type="checkbox"
                                    name="channels.inApp"
                                    checked={formState.channels.inApp}
                                    onChange={handleInputChange}
                                />
                                <span>In-app feed</span>
                            </label>
                            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
                                <input
                                    type="checkbox"
                                    name="channels.email"
                                    checked={formState.channels.email}
                                    onChange={handleInputChange}
                                />
                                <span>Email</span>
                            </label>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="tw-text-sm tw-font-medium tw-text-gray-700">Announcements feed</legend>
                        <div className="tw-flex tw-items-start tw-gap-3 tw-mt-2">
                            <input
                                id="publishToAnnouncements"
                                type="checkbox"
                                name="publishToAnnouncements"
                                checked={formState.publishToAnnouncements && !publishDisabled}
                                onChange={handleInputChange}
                                disabled={publishDisabled}
                            />
                            <div>
                                <label htmlFor="publishToAnnouncements" className="tw-text-sm tw-font-medium tw-text-gray-800">
                                    Show on mentee and mentor announcement pages
                                </label>
                                <p className="tw-text-xs tw-text-gray-500">
                                    Available for all-users or role-based audiences. Custom recipient blasts stay private.
                                </p>
                            </div>
                        </div>
                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mt-4">
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="summary">
                                    Announcement summary
                                </label>
                                <textarea
                                    id="summary"
                                    name="summary"
                                    value={formState.summary}
                                    onChange={handleInputChange}
                                    rows={2}
                                    disabled={publishDisabled}
                                    className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                                    placeholder="Short blurb shown on announcement page"
                                />
                            </div>
                            <div>
                                <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
                                    <input
                                        type="checkbox"
                                        name="isFeatured"
                                        checked={formState.isFeatured}
                                        onChange={handleInputChange}
                                        disabled={publishDisabled}
                                    />
                                    <span>Mark as featured</span>
                                </label>
                            </div>
                        </div>
                        <div className="tw-mt-4">
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="body">
                                Announcement body (optional)
                            </label>
                            <textarea
                                id="body"
                                name="body"
                                value={formState.body}
                                onChange={handleInputChange}
                                rows={3}
                                disabled={publishDisabled}
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                                placeholder="Defaults to the announcement message if left blank."
                            />
                        </div>
                    </fieldset>

                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="context">
                            Additional context (JSON, optional)
                        </label>
                        <textarea
                            id="context"
                            name="context"
                            value={dataPayload}
                            onChange={(event) => setDataPayload(event.target.value)}
                            rows={3}
                            className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                            placeholder='{"sessionId":"abc123"}'
                        />
                        {dataError && <p className="tw-text-xs tw-text-red-600 tw-mt-1">{dataError}</p>}
                    </div>

                    <div className="tw-flex tw-justify-end tw-gap-3">
                        <button
                            type="reset"
                            onClick={() => {
                                setFormState(createInitialState());
                                setDataPayload('');
                                setDataError(null);
                                setFeedback(null);
                            }}
                            className="tw-text-sm tw-font-medium tw-text-gray-700 tw-border tw-border-gray-300 tw-rounded-lg tw-px-4 tw-py-2 hover:tw-bg-gray-50"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-indigo-600 tw-px-5 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-indigo-700 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-indigo-500"
                            disabled={sendNotification.isPending}
                        >
                            {sendNotification.isPending ? 'Sending…' : 'Send announcement'}
                        </button>
                    </div>
                </form>
                </section>

                <section
                    className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-p-6 tw-shadow-sm"
                    aria-label="Announcement history"
                >
                    <header className="tw-mb-6 tw-flex tw-items-center tw-justify-between">
                        <div>
                            <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-gray-500">History</p>
                            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Recent announcements</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => refetchLogs()}
                            className="tw-text-sm tw-font-medium tw-text-indigo-600 hover:tw-text-indigo-800"
                        >
                            Refresh
                        </button>
                    </header>

                    {logsLoading && <div className="tw-text-sm tw-text-gray-500">Loading latest activity…</div>}

                    {!logsLoading && trimmedLogs.length === 0 && (
                        <div className="tw-text-sm tw-text-gray-500">No announcements have been sent yet.</div>
                    )}

                    <ul className="tw-space-y-4">
                        {trimmedLogs.map((log) => (
                            <li key={log.id} className="tw-border tw-border-gray-100 tw-rounded-lg tw-p-4">
                                <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
                                    <div>
                                        <p className="tw-text-sm tw-font-semibold tw-text-gray-900">{log.title}</p>
                                        <p className="tw-text-xs tw-text-gray-500">{log.message}</p>
                                    </div>
                                    <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-gray-100 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-gray-700">
                                        {log.type}
                                    </span>
                                </div>
                                <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-3 tw-text-xs tw-text-gray-600">
                                    <span>
                                        Audience: <strong>{describeScope(log)}</strong>
                                    </span>
                                    <span>
                                        Sent: <strong>{formatDateTime(log.createdAt)}</strong>
                                    </span>
                                    <span>
                                        Recipients: <strong>{log.recipientCount}</strong>
                                    </span>
                                    <span>
                                        Channels:
                                        <strong>
                                            {' '}
                                            {log.channels.inApp ? 'In-app' : ''}
                                            {log.channels.inApp && log.channels.email ? ' + ' : ''}
                                            {log.channels.email ? 'Email' : ''}
                                        </strong>
                                    </span>
                                    {log.failures > 0 && (
                                        <span className="tw-text-red-600">
                                            Failures: <strong>{log.failures}</strong>
                                        </span>
                                    )}
                                    {log.announcement && (
                                        <span className="tw-text-emerald-600">
                                            Announcement feed ({log.announcement.audience})
                                        </span>
                                    )}
                                </div>
                                {log.createdBy && (
                                    <p className="tw-mt-2 tw-text-xs tw-text-gray-500">
                                        Sent by {log.createdBy.name} ({log.createdBy.email})
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <section className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-p-6 tw-shadow-sm" aria-label="Published announcements">
                <header className="tw-mb-6 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                    <div>
                        <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-gray-500">Feed</p>
                        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Manage published announcements</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetchAnnouncements()}
                        className="tw-text-sm tw-font-medium tw-text-indigo-600 hover:tw-text-indigo-800"
                    >
                        Refresh
                    </button>
                </header>

                {announcementsLoading && (
                    <div className="tw-text-sm tw-text-gray-500">Loading announcements…</div>
                )}
                {announcementsError && !announcementsLoading && (
                    <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4" role="alert">
                        <p className="tw-text-red-700 tw-text-sm">Unable to load announcements. Try refreshing.</p>
                    </div>
                )}
                {!announcementsLoading && !announcementsError && announcements.length === 0 && (
                    <div className="tw-text-sm tw-text-gray-500">No announcements have been published yet.</div>
                )}

                <ul className="tw-space-y-4">
                    {announcements.map((announcement) => (
                        <li key={announcement.id} className="tw-border tw-border-gray-100 tw-rounded-lg tw-p-4">
                            <div className="tw-flex tw-flex-wrap tw-justify-between tw-gap-4">
                                <div>
                                    <p className="tw-text-base tw-font-semibold tw-text-gray-900">{announcement.title}</p>
                                    <p className="tw-text-xs tw-text-gray-500">
                                        Audience: {announcement.audience} · Published {formatDateTime(announcement.publishedAt)}
                                    </p>
                                    <p className="tw-text-sm tw-text-gray-600 tw-mt-2">{announcement.summary || announcement.body}</p>
                                </div>
                                <div className="tw-flex tw-items-start tw-gap-3">
                                    <button
                                        type="button"
                                        className="tw-text-sm tw-font-medium tw-text-indigo-600 hover:tw-text-indigo-800"
                                        onClick={() => startEditing(announcement)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteAnnouncement(announcement)}
                                        className="tw-text-sm tw-font-medium tw-text-red-600 hover:tw-text-red-800"
                                        disabled={deleteAnnouncementMutation.isPending}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            {editingAnnouncement && editFormState && (
                <section className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-p-6 tw-shadow-sm" aria-label="Edit announcement">
                    <header className="tw-mb-4">
                        <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-indigo-500">Edit mode</p>
                        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Update “{editingAnnouncement.title}”</h2>
                        <p className="tw-text-sm tw-text-gray-600">Changes update the mentee and mentor announcement pages instantly.</p>
                    </header>

                    {editFeedback && (
                        <div
                            className={
                                editFeedback.type === 'success'
                                    ? 'tw-bg-green-50 tw-border tw-border-green-200 tw-text-green-800 tw-rounded-lg tw-p-3 tw-mb-4'
                                    : 'tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-800 tw-rounded-lg tw-p-3 tw-mb-4'
                            }
                            role="alert"
                            aria-live="assertive"
                        >
                            {editFeedback.message}
                        </div>
                    )}

                    <form className="tw-space-y-4" onSubmit={handleEditSubmit}>
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="edit-title">
                                Title
                            </label>
                            <input
                                id="edit-title"
                                name="title"
                                value={editFormState.title}
                                onChange={handleEditInputChange}
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="edit-summary">
                                Summary
                            </label>
                            <textarea
                                id="edit-summary"
                                name="summary"
                                value={editFormState.summary}
                                onChange={handleEditInputChange}
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="edit-body">
                                Body
                            </label>
                            <textarea
                                id="edit-body"
                                name="body"
                                value={editFormState.body}
                                onChange={handleEditInputChange}
                                className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                                rows={4}
                                required
                            />
                        </div>

                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="edit-category">
                                    Category
                                </label>
                                <input
                                    id="edit-category"
                                    name="category"
                                    value={editFormState.category}
                                    onChange={handleEditInputChange}
                                    className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                                />
                            </div>
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="edit-audience">
                                    Audience
                                </label>
                                <select
                                    id="edit-audience"
                                    name="audience"
                                    value={editFormState.audience}
                                    onChange={handleEditInputChange}
                                    className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                                >
                                    <option value="all">All users</option>
                                    <option value="mentors">Mentors</option>
                                    <option value="mentees">Mentees</option>
                                </select>
                            </div>
                        </div>

                        <div className="tw-flex tw-flex-wrap tw-gap-4">
                            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
                                <input
                                    type="checkbox"
                                    name="isFeatured"
                                    checked={editFormState.isFeatured}
                                    onChange={handleEditInputChange}
                                />
                                <span>Mark as featured</span>
                            </label>
                            <div className="tw-flex tw-flex-col">
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="edit-publishedAt">
                                    Published at
                                </label>
                                <input
                                    type="datetime-local"
                                    id="edit-publishedAt"
                                    name="publishedAt"
                                    value={editFormState.publishedAt}
                                    onChange={handleEditInputChange}
                                    className="tw-mt-1 tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-indigo-500 focus:tw-border-transparent"
                                />
                            </div>
                        </div>

                        <div className="tw-flex tw-justify-end tw-gap-3">
                            <button
                                type="button"
                                onClick={cancelEditing}
                                className="tw-text-sm tw-font-medium tw-text-gray-700 tw-border tw-border-gray-300 tw-rounded-lg tw-px-4 tw-py-2 hover:tw-bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-indigo-600 tw-px-5 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-indigo-700 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-indigo-500"
                                disabled={updateAnnouncementMutation.isPending}
                            >
                                {updateAnnouncementMutation.isPending ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </div>
    );
};

export default AdminAnnouncementCenter;
