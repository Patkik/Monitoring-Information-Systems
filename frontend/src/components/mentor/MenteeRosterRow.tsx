import React from 'react';
import { MentorRosterEntry } from '../../shared/services/mentorService';

const StatusPill: React.FC<{ status?: string }> = ({ status = 'inactive' }) => {
    const base = 'tw-inline-flex tw-items-center tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-semibold';
    const colorMap: Record<string, string> = {
        active: 'tw-bg-green-100 tw-text-green-800',
        inactive: 'tw-bg-gray-100 tw-text-gray-700',
        paused: 'tw-bg-yellow-100 tw-text-yellow-800',
    };
    const cls = colorMap[status] || colorMap.inactive;
    return <span className={`${base} ${cls}`}>{status}</span>;
};

interface MenteeRosterRowProps {
    mentee: MentorRosterEntry;
    onViewProgress?: () => void;
}

const MenteeRosterRow: React.FC<MenteeRosterRowProps> = ({ mentee, onViewProgress }) => {
    const progress = mentee.progress ?? 0;

    return (
        <>
            {/* Desktop Row */}
            <tr className="tw-hidden md:tw-table-row hover:tw-bg-gray-50 tw-transition-colors">
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                    <div className="tw-flex tw-items-center tw-gap-3">
                        {mentee.avatar && (
                            <img src={mentee.avatar} alt={mentee.name} className="tw-w-8 tw-h-8 tw-rounded-full tw-object-cover" />
                        )}
                        <div>
                            <p className="tw-font-medium tw-text-gray-900">{mentee.name}</p>
                        </div>
                    </div>
                </td>
                <td className="tw-px-6 tw-py-4 tw-text-gray-600 tw-text-sm tw-truncate">{mentee.email}</td>
                <td className="tw-px-6 tw-py-4">
                    <StatusPill status={mentee.status} />
                </td>
                <td className="tw-px-6 tw-py-4">
                    <div className="tw-flex tw-items-center tw-gap-2">
                        <div className="tw-w-32 tw-h-2 tw-bg-gray-200 tw-rounded-full tw-overflow-hidden">
                            <div
                                className="tw-h-full tw-bg-gradient-to-r tw-from-primary tw-to-purple-500 tw-transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-min-w-fit">{progress}%</span>
                    </div>
                </td>
                <td className="tw-px-6 tw-py-4 tw-text-right">
                    <button
                        onClick={onViewProgress}
                        className="tw-inline-flex tw-items-center tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-text-white tw-bg-primary hover:tw-bg-primary/90 tw-transition-colors focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary"
                        title="View detailed progress and mentee information"
                    >
                        View Progress
                    </button>
                </td>
            </tr>

            {/* Mobile Card */}
            <div className="md:tw-hidden tw-space-y-3">
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
                    <div className="tw-flex tw-items-center tw-gap-3 tw-flex-1 tw-min-w-0">
                        {mentee.avatar && (
                            <img src={mentee.avatar} alt={mentee.name} className="tw-w-10 tw-h-10 tw-rounded-full tw-object-cover tw-flex-shrink-0" />
                        )}
                        <div className="tw-min-w-0">
                            <p className="tw-font-semibold tw-text-gray-900 tw-truncate">{mentee.name}</p>
                            <p className="tw-text-xs tw-text-gray-600 tw-truncate">{mentee.email}</p>
                        </div>
                    </div>
                    <StatusPill status={mentee.status} />
                </div>
                <div className="tw-space-y-2">
                    <div className="tw-flex tw-items-center tw-justify-between tw-text-sm">
                        <span className="tw-text-gray-600">Progress</span>
                        <span className="tw-font-semibold tw-text-gray-900">{progress}%</span>
                    </div>
                    <div className="tw-w-full tw-h-2 tw-bg-gray-200 tw-rounded-full tw-overflow-hidden">
                        <div
                            className="tw-h-full tw-bg-gradient-to-r tw-from-primary tw-to-purple-500 tw-transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <button className="tw-w-full tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-text-white tw-bg-primary hover:tw-bg-primary/90 tw-transition-colors focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary"
                        onClick={onViewProgress}>
                        View Progress
                    </button>
                </div>
            </div>
        </>
    );
};

export default MenteeRosterRow;