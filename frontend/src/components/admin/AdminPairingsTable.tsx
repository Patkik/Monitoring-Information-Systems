import React from 'react';
import { PairingRecord } from '../../features/admin/hooks/usePairings';

interface AdminPairingsTableProps {
    pairings: PairingRecord[];
    isLoading: boolean;
    error?: string | null;
    page: number;
    totalPages: number;
    onPageChange: (direction: 'prev' | 'next') => void;
    onInspect: (pairingId: string) => void;
}

const statusStyles: Record<string, string> = {
    active: 'tw-bg-green-100 tw-text-green-800',
    paused: 'tw-bg-amber-100 tw-text-amber-800',
    completed: 'tw-bg-blue-100 tw-text-blue-800',
    cancelled: 'tw-bg-red-100 tw-text-red-700',
};

const formatDate = (value?: string) => {
    if (!value) {
        return '—';
    }
    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
};

const AdminPairingsTable: React.FC<AdminPairingsTableProps> = ({
    pairings,
    isLoading,
    error,
    page,
    totalPages,
    onPageChange,
    onInspect,
}) => {
    if (isLoading) {
        return <p className="tw-text-sm tw-text-gray-500">Loading pairings…</p>;
    }

    if (error) {
        return <p className="tw-text-sm tw-text-red-600">{error}</p>;
    }

    if (!pairings.length) {
        return <p className="tw-text-sm tw-text-gray-500">No pairings match the current filters.</p>;
    }

    return (
        <div className="tw-space-y-4">
            <div className="tw-overflow-x-auto tw-rounded-2xl tw-border tw-border-gray-100 tw-bg-white tw-shadow-sm">
                <table className="tw-min-w-full tw-text-sm">
                    <thead>
                        <tr className="tw-text-left tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wider tw-border-b tw-border-gray-100">
                            <th className="tw-px-4 tw-py-3">Mentor</th>
                            <th className="tw-px-4 tw-py-3">Mentee</th>
                            <th className="tw-px-4 tw-py-3">Status</th>
                            <th className="tw-px-4 tw-py-3 tw-text-right">Sessions</th>
                            <th className="tw-px-4 tw-py-3">Started</th>
                            <th className="tw-px-4 tw-py-3">Updated</th>
                            <th className="tw-px-4 tw-py-3" aria-label="Actions" />
                        </tr>
                    </thead>
                    <tbody className="tw-divide-y tw-divide-gray-100">
                        {pairings.map((record) => (
                            <tr key={record.id} className="tw-text-gray-900">
                                <td className="tw-px-4 tw-py-3">
                                    <div className="tw-flex tw-flex-col">
                                        <span className="tw-font-medium">{record.mentor?.name ?? 'Unknown mentor'}</span>
                                        <span className="tw-text-xs tw-text-gray-500">{record.mentor?.email ?? 'No email'}</span>
                                    </div>
                                </td>
                                <td className="tw-px-4 tw-py-3">
                                    <div className="tw-flex tw-flex-col">
                                        <span className="tw-font-medium">{record.mentee?.name ?? 'Unknown mentee'}</span>
                                        <span className="tw-text-xs tw-text-gray-500">{record.mentee?.email ?? 'No email'}</span>
                                    </div>
                                </td>
                                <td className="tw-px-4 tw-py-3">
                                    <span
                                        className={`tw-inline-flex tw-rounded-full tw-px-3 tw-py-1 tw-text-xs tw-font-semibold ${
                                            statusStyles[record.status] ?? 'tw-bg-gray-100 tw-text-gray-700'
                                        }`}
                                    >
                                        {record.status}
                                    </span>
                                </td>
                                <td className="tw-px-4 tw-py-3 tw-text-right">{record.sessionsCount}</td>
                                <td className="tw-px-4 tw-py-3">{formatDate(record.startedAt)}</td>
                                <td className="tw-px-4 tw-py-3">{formatDate(record.updatedAt)}</td>
                                <td className="tw-px-4 tw-py-3 tw-text-right">
                                    <button
                                        type="button"
                                        onClick={() => onInspect(record.id)}
                                        className="tw-rounded-full tw-bg-purple-600 tw-px-4 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700 focus:tw-ring-2 focus:tw-ring-purple-600"
                                    >
                                        Inspect
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="tw-flex tw-items-center tw-justify-between">
                <p className="tw-text-sm tw-text-gray-500">
                    Page {page} of {totalPages || 1}
                </p>
                <div className="tw-flex tw-gap-2">
                    <button
                        type="button"
                        className="tw-rounded-full tw-border tw-border-gray-300 tw-px-3 tw-py-1 tw-text-sm tw-text-gray-700 disabled:tw-opacity-50"
                        onClick={() => onPageChange('prev')}
                        disabled={page <= 1}
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        className="tw-rounded-full tw-border tw-border-gray-300 tw-px-3 tw-py-1 tw-text-sm tw-text-gray-700 disabled:tw-opacity-50"
                        onClick={() => onPageChange('next')}
                        disabled={page >= (totalPages || 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPairingsTable;
