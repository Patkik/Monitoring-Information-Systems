import React, { useMemo, useState } from 'react';
import AvailabilityForm from './AvailabilityForm';
import AvailabilityList from './AvailabilityList';
import {
    AvailabilityEntry,
    AvailabilityPayload,
    AvailabilitySlot,
} from '../../../shared/services/availabilityService';
import {
    useCreateAvailability,
    useDeleteAvailability,
    useMentorAvailability,
    useUpdateAvailability,
} from '../../../features/sessions/hooks/useMentorAvailability';
import logger from '../../../shared/utils/logger';

interface StoredUser {
    _id?: string;
    id?: string;
    mentorId?: string;
    profile?: {
        timezone?: string;
    };
}

const readStoredUser = (): StoredUser | null => {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
        logger.error('Unable to parse stored user', error);
        return null;
    }
};

const computeDefaultTimezone = (user: StoredUser | null): string => {
    if (user?.profile?.timezone) {
        return user.profile.timezone;
    }
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    }
    return 'UTC';
};

const MentorAvailabilityManager: React.FC = () => {
    const storedUser = useMemo(() => readStoredUser(), []);
    const mentorId = storedUser?._id || storedUser?.id || storedUser?.mentorId || null;
    const defaultTimezone = computeDefaultTimezone(storedUser);

    const [includeInactive, setIncludeInactive] = useState(false);
    const [editingEntry, setEditingEntry] = useState<AvailabilityEntry | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AvailabilityEntry | null>(null);
    const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const {
        availability,
        slots,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useMentorAvailability(mentorId ?? undefined, { includeInactive });

    const createAvailability = useCreateAvailability(mentorId ?? undefined);
    const updateAvailability = useUpdateAvailability(mentorId ?? undefined);
    const deleteAvailability = useDeleteAvailability(mentorId ?? undefined);

    const mutationInFlight = createAvailability.isLoading || updateAvailability.isLoading || deleteAvailability.isLoading;

    const slotsByAvailability = useMemo(() => {
        const map = new Map<string, AvailabilitySlot[]>();
        slots.forEach((slot) => {
            const list = map.get(slot.availabilityId) ?? [];
            list.push(slot);
            map.set(slot.availabilityId, list);
        });
        map.forEach((list) => list.sort((a, b) => Date.parse(a.start) - Date.parse(b.start)));
        return map;
    }, [slots]);

    const stats = useMemo(() => {
        const active = availability.filter((entry) => entry.active).length;
        const inactive = availability.length - active;
        const now = Date.now();
        const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
        const nextWeekSlots = slots.filter((slot) => {
            const start = Date.parse(slot.start);
            return start >= now && start <= sevenDaysFromNow;
        }).length;
        const openSeats = slots.reduce((sum, slot) => sum + Math.max(slot.remaining, 0), 0);
        return { active, inactive, nextWeekSlots, openSeats };
    }, [availability, slots]);

    const extractErrorMessage = (err: unknown) => {
        if (!err) {
            return 'Something went wrong. Please try again.';
        }
        if (typeof err === 'string') {
            return err;
        }
        if (err instanceof Error) {
            return err.message;
        }
        if (typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
            return (err as any).message;
        }
        return 'Unable to complete the action.';
    };

    const handleCreate = async (payload: AvailabilityPayload) => {
        if (!mentorId) {
            setBanner({ type: 'error', message: 'Mentor account not found. Sign in again.' });
            return;
        }
        try {
            await createAvailability.mutateAsync(payload);
            setBanner({ type: 'success', message: 'Availability published and slots will generate shortly.' });
        } catch (err) {
            setBanner({ type: 'error', message: extractErrorMessage(err) });
        }
    };

    const handleUpdate = async (payload: AvailabilityPayload) => {
        if (!mentorId || !editingEntry) {
            return;
        }
        try {
            await updateAvailability.mutateAsync({ availabilityId: editingEntry.id, payload });
            setBanner({ type: 'success', message: 'Availability updated.' });
            setEditingEntry(null);
        } catch (err) {
            setBanner({ type: 'error', message: extractErrorMessage(err) });
        }
    };

    const handleDelete = async () => {
        if (!mentorId || !deleteTarget) {
            return;
        }
        try {
            await deleteAvailability.mutateAsync(deleteTarget.id);
            setBanner({ type: 'success', message: 'Availability removed.' });
            setDeleteTarget(null);
        } catch (err) {
            setBanner({ type: 'error', message: extractErrorMessage(err) });
        }
    };

    const renderListSection = () => {
        if (isLoading) {
            return (
                <div className="tw-space-y-3" role="status" aria-live="polite">
                    {[...Array(3)].map((_, index) => (
                        <div key={`skeleton-${index}`} className="tw-h-32 tw-bg-gray-100 tw-rounded-2xl tw-animate-pulse" />
                    ))}
                </div>
            );
        }
        if (isError) {
            return (
                <div className="tw-rounded-2xl tw-border tw-border-red-200 tw-bg-red-50 tw-p-4" role="alert">
                    <p className="tw-text-sm tw-font-semibold tw-text-red-800">Unable to load availability.</p>
                    <p className="tw-text-sm tw-text-red-700 tw-mt-1">{extractErrorMessage(error)}</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="tw-mt-3 tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-red-200 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-red-700"
                    >
                        Retry
                    </button>
                </div>
            );
        }
        return (
            <AvailabilityList
                availability={availability}
                slotsByAvailability={slotsByAvailability}
                onEdit={setEditingEntry}
                onDelete={setDeleteTarget}
                isMutating={mutationInFlight}
            />
        );
    };

    if (!mentorId) {
        return (
            <section className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-6 tw-text-center">
                <p className="tw-text-lg tw-font-semibold tw-text-gray-900">Mentor account unavailable</p>
                <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                    Sign in with a mentor profile to configure booking availability.
                </p>
            </section>
        );
    }

    return (
        <section className="tw-space-y-6">
            <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-6">
                <p className="tw-text-xs tw-font-bold tw-tracking-wide tw-uppercase tw-text-primary">Mentor scheduling</p>
                <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mt-1">Publish open mentoring hours</h2>
                <p className="tw-text-sm tw-text-gray-500 tw-mt-2 tw-max-w-3xl">
                    Control when mentees can book time with you. Publish recurring office hours, one-off deep-dive windows,
                    and keep everything synced with session requests.
                </p>
                <dl className="tw-mt-6 tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-4 tw-text-center">
                        <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-500">Active entries</dt>
                        <dd className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.active}</dd>
                    </div>
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-4 tw-text-center">
                        <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-500">Inactive</dt>
                        <dd className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.inactive}</dd>
                    </div>
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-4 tw-text-center">
                        <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-500">Slots next 7 days</dt>
                        <dd className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.nextWeekSlots}</dd>
                    </div>
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-4 tw-text-center">
                        <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-500">Open seats</dt>
                        <dd className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.openSeats}</dd>
                    </div>
                </dl>
            </div>

            {banner ? (
                <div
                    className={`tw-rounded-xl tw-border tw-p-4 ${
                        banner.type === 'success'
                            ? 'tw-border-green-200 tw-bg-green-50 tw-text-green-800'
                            : 'tw-border-red-200 tw-bg-red-50 tw-text-red-800'
                    }`}
                    role="status"
                >
                    <div className="tw-flex tw-justify-between tw-items-start">
                        <p className="tw-text-sm tw-font-medium">{banner.message}</p>
                        <button
                            type="button"
                            onClick={() => setBanner(null)}
                            className="tw-text-xs tw-font-semibold"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
                <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-6">
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                        <div>
                            <p className="tw-text-xs tw-font-semibold tw-text-primary tw-uppercase">New availability</p>
                            <h3 className="tw-text-lg tw-font-bold tw-text-gray-900">Create booking window</h3>
                        </div>
                        {isFetching ? (
                            <span className="tw-text-xs tw-font-medium tw-text-gray-400">Refreshing…</span>
                        ) : null}
                    </div>
                    <AvailabilityForm
                        mode="create"
                        defaultTimezone={defaultTimezone}
                        onSubmit={handleCreate}
                        isSubmitting={createAvailability.isLoading}
                    />
                </div>
                <div className="lg:tw-col-span-2 tw-space-y-4">
                    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between">
                        <p className="tw-text-sm tw-font-bold tw-text-gray-800">Your availability</p>
                        <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
                            <input
                                type="checkbox"
                                className="tw-rounded tw-border-gray-300 tw-text-primary focus:tw-ring-primary"
                                checked={includeInactive}
                                onChange={(event) => setIncludeInactive(event.target.checked)}
                            />
                            Show inactive entries
                        </label>
                    </div>
                    {renderListSection()}
                </div>
            </div>

            {editingEntry ? (
                <div
                    className="tw-fixed tw-inset-0 tw-bg-black/40 tw-backdrop-blur-sm tw-flex tw-items-center tw-justify-center tw-z-40"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-2xl tw-w-full tw-max-w-3xl tw-p-6 tw-space-y-4">
                        <div className="tw-flex tw-justify-between tw-items-center">
                            <div>
                                <p className="tw-text-xs tw-font-semibold tw-text-primary tw-uppercase">Edit availability</p>
                                <h3 className="tw-text-xl tw-font-bold tw-text-gray-900">
                                    {editingEntry.type === 'recurring' ? 'Recurring window' : 'One-off slot'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingEntry(null)}
                                className="tw-text-sm tw-font-semibold tw-text-gray-500 hover:tw-text-gray-700"
                            >
                                Close
                            </button>
                        </div>
                        <AvailabilityForm
                            mode="edit"
                            initialEntry={editingEntry}
                            defaultTimezone={defaultTimezone}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditingEntry(null)}
                            isSubmitting={updateAvailability.isLoading}
                        />
                    </div>
                </div>
            ) : null}

            {deleteTarget ? (
                <div
                    className="tw-fixed tw-inset-0 tw-bg-black/30 tw-flex tw-items-center tw-justify-center tw-z-40"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-2xl tw-w-full tw-max-w-md tw-p-6 tw-space-y-4">
                        <h3 className="tw-text-lg tw-font-bold tw-text-gray-900">Remove availability?</h3>
                        <p className="tw-text-sm tw-text-gray-600">
                            This will cancel any unused slots tied to this window. Existing booked sessions remain active.
                        </p>
                        <div className="tw-flex tw-justify-end tw-gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-gray-700"
                            >
                                Keep entry
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="tw-rounded-lg tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold hover:tw-bg-red-700 disabled:tw-opacity-60"
                                disabled={deleteAvailability.isLoading}
                            >
                                {deleteAvailability.isLoading ? 'Removing…' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

export default MentorAvailabilityManager;
