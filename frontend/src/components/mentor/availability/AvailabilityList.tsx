import React, { useMemo } from 'react';
import { AvailabilityEntry, AvailabilitySlot } from '../../../shared/services/availabilityService';

export interface AvailabilityListProps {
    availability: AvailabilityEntry[];
    slotsByAvailability: Map<string, AvailabilitySlot[]>;
    onEdit: (entry: AvailabilityEntry) => void;
    onDelete: (entry: AvailabilityEntry) => void;
    isMutating?: boolean;
}

const formatSlotRange = (slot: AvailabilitySlot) => {
    try {
        const formatter = new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
        const start = formatter.format(new Date(slot.start));
        const end = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(slot.end));
        return `${start} – ${end}`;
    } catch {
        return `${slot.start} - ${slot.end}`;
    }
};

const AvailabilityList: React.FC<AvailabilityListProps> = ({ availability, slotsByAvailability, onEdit, onDelete, isMutating }) => {
    const sortedEntries = useMemo(() => {
        return [...availability].sort((a, b) => {
            const aDate = a.updatedAt ? Date.parse(a.updatedAt) : 0;
            const bDate = b.updatedAt ? Date.parse(b.updatedAt) : 0;
            return bDate - aDate;
        });
    }, [availability]);

    if (availability.length === 0) {
        return (
            <div className="tw-text-center tw-py-12 tw-bg-white tw-border tw-border-dashed tw-border-gray-200 tw-rounded-xl tw-shadow-sm">
                <p className="tw-text-lg tw-font-semibold tw-text-gray-900">No availability published</p>
                <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                    Create a recurring schedule or a one-off slot to let mentees book with you.
                </p>
            </div>
        );
    }

    return (
        <div className="tw-space-y-4">
            {sortedEntries.map((entry) => {
                const entrySlots = slotsByAvailability.get(entry.id) || [];
                const nextSlots = entrySlots.slice(0, 3);
                const totalRemaining = entrySlots.reduce((sum, slot) => sum + Math.max(slot.remaining, 0), 0);
                return (
                    <article key={entry.id} className="tw-bg-white tw-border tw-border-gray-100 tw-rounded-xl tw-shadow-sm tw-p-5 tw-space-y-4">
                        <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-justify-between tw-gap-4">
                            <div className="tw-space-y-1">
                                <div className="tw-flex tw-items-center tw-gap-3">
                                    <span className="tw-text-sm tw-font-semibold tw-text-primary tw-uppercase">
                                        {entry.type === 'recurring' ? 'Recurring window' : 'One-off slot'}
                                    </span>
                                    <span
                                        className={`tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-text-[11px] tw-font-semibold tw-px-2 tw-py-0.5 ${
                                            entry.active
                                                ? 'tw-bg-green-50 tw-text-green-700'
                                                : 'tw-bg-gray-100 tw-text-gray-600'
                                        }`}
                                    >
                                        <span aria-hidden="true">●</span>
                                        {entry.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p className="tw-text-sm tw-text-gray-600">
                                    Timezone: <span className="tw-font-semibold">{entry.timezone}</span> · Capacity: {entry.capacity} mentee
                                    {entry.capacity > 1 ? 's' : ''}
                                </p>
                                {entry.note ? (
                                    <p className="tw-text-sm tw-text-gray-500">Note: {entry.note}</p>
                                ) : null}
                            </div>
                            <div className="tw-flex tw-flex-wrap tw-gap-2 tw-justify-start lg:tw-justify-end">
                                <button
                                    type="button"
                                    onClick={() => onEdit(entry)}
                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-gray-700 hover:tw-bg-gray-50"
                                    disabled={isMutating}
                                >
                                    Edit entry
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(entry)}
                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-red-700 hover:tw-bg-red-100 disabled:tw-opacity-50"
                                    disabled={isMutating}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>

                        <div>
                            <p className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Upcoming slots</p>
                            {nextSlots.length ? (
                                <ul className="tw-mt-2 tw-space-y-1">
                                    {nextSlots.map((slot) => (
                                        <li key={slot.slotId} className="tw-flex tw-items-center tw-justify-between tw-text-sm tw-text-gray-700">
                                            <span>
                                                {formatSlotRange(slot)}
                                                <span className="tw-text-xs tw-text-gray-400"> · {slot.timezone}</span>
                                            </span>
                                            <span className="tw-text-xs tw-font-medium tw-text-gray-600">
                                                {slot.remaining} open / {slot.capacity}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="tw-text-sm tw-text-gray-500 tw-mt-1">No generated slots yet within the selected range.</p>
                            )}
                        </div>

                        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-text-xs tw-text-gray-500">
                            <span>Remaining seats: {totalRemaining}</span>
                            {entry.updatedAt ? <span>Updated {new Date(entry.updatedAt).toLocaleDateString()}</span> : null}
                            {entry.createdAt ? <span>Created {new Date(entry.createdAt).toLocaleDateString()}</span> : null}
                        </div>
                    </article>
                );
            })}
        </div>
    );
};

export default AvailabilityList;
