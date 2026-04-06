import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useMentorRoster } from '../../shared/hooks/useMentorRoster';
import MenteeRosterRow from '../../components/mentor/MenteeRosterRow';
import MenteeProgressModal from '../../components/mentor/MenteeProgressModal';

const MentorRosterPage: React.FC = () => {
    const { data: mentees = [], isLoading, isError } = useMentorRoster();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'paused'>('all');
    const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
    const selectedMentee = mentees.find((m) => m.id === selectedMenteeId);

    const filteredMentees = useMemo(() => {
        const lower = searchTerm.trim().toLowerCase();
        return mentees.filter((mentee) => {
            const isNameMatch = mentee.name.toLowerCase().includes(lower) || mentee.email.toLowerCase().includes(lower);
            const isStatusMatch = statusFilter === 'all' || mentee.status === statusFilter;
            return isNameMatch && isStatusMatch;
        });
    }, [mentees, searchTerm, statusFilter]);

    return (
        <DashboardLayout>
            <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-space-y-6">
                {/* Header */}
                <div className="tw-bg-gradient-to-r tw-from-primary tw-to-purple-500 tw-rounded-2xl tw-p-6 tw-text-white tw-shadow-xl">
                    <p className="tw-text-sm tw-uppercase tw-tracking-wide tw-font-semibold tw-text-white/80">Mentor workspace</p>
                    <h1 className="tw-text-3xl tw-font-bold tw-mt-1">My Mentees</h1>
                    <p className="tw-mt-2 tw-text-sm tw-text-white/80">
                        View and manage your mentee roster, track progress, and access mentee information.
                    </p>
                </div>

                {/* Filters and Search */}
                <div className="tw-bg-white tw-rounded-xl tw-shadow tw-p-4 tw-space-y-4">
                    <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-4">
                        <div className="tw-flex-1">
                            <input
                                type="text"
                                placeholder="Search mentees by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm tw-placeholder-gray-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                            />
                        </div>
                        <div className="tw-flex tw-gap-2">
                            {(['all', 'active', 'inactive', 'paused'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-rounded-lg tw-transition-colors ${
                                        statusFilter === status
                                            ? 'tw-bg-primary tw-text-white'
                                            : 'tw-bg-gray-200 tw-text-gray-700 hover:tw-bg-gray-300'
                                    }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isLoading && (
                    <div className="tw-bg-white tw-rounded-xl tw-shadow tw-p-8 tw-text-center">
                        <div className="tw-space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="tw-h-16 tw-bg-gray-200 tw-rounded-lg tw-animate-pulse" />
                            ))}
                        </div>
                    </div>
                )}

                {isError && (
                    <div className="tw-bg-white tw-rounded-xl tw-shadow tw-p-8 tw-text-center">
                        <p className="tw-text-red-600 tw-font-semibold">Error loading mentees. Please try again.</p>
                    </div>
                )}

                {!isLoading && !isError && filteredMentees.length === 0 && (
                    <div className="tw-bg-white tw-rounded-xl tw-shadow tw-p-12 tw-text-center">
                        <svg className="tw-w-12 tw-h-12 tw-text-gray-400 tw-mx-auto tw-mb-4" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12.5v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="tw-text-gray-500 tw-font-medium">No mentees found</p>
                        <p className="tw-text-gray-400 tw-text-sm tw-mt-1">
                            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'You have no mentees yet.'}
                        </p>
                    </div>
                )}

                {!isLoading && !isError && filteredMentees.length > 0 && (
                    <div className="tw-bg-white tw-rounded-xl tw-shadow tw-overflow-hidden">
                        {/* Responsive Table */}
                        <div className="tw-hidden md:tw-block tw-overflow-x-auto">
                            <table className="tw-w-full tw-text-sm">
                                <thead className="tw-bg-gray-50 tw-border-b tw-border-gray-200">
                                    <tr>
                                        <th className="tw-text-left tw-px-6 tw-py-3 tw-font-semibold tw-text-gray-700">Name</th>
                                        <th className="tw-text-left tw-px-6 tw-py-3 tw-font-semibold tw-text-gray-700">Email</th>
                                        <th className="tw-text-left tw-px-6 tw-py-3 tw-font-semibold tw-text-gray-700">Status</th>
                                        <th className="tw-text-left tw-px-6 tw-py-3 tw-font-semibold tw-text-gray-700">Progress</th>
                                        <th className="tw-text-right tw-px-6 tw-py-3 tw-font-semibold tw-text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="tw-divide-y tw-divide-gray-200">
                                    {filteredMentees.map((mentee) => (
                                        <MenteeRosterRow
                                            key={mentee.id}
                                            mentee={mentee}
                                            onViewProgress={() => setSelectedMenteeId(mentee.id)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List */}
                        <div className="md:tw-hidden tw-divide-y tw-divide-gray-200">
                            {filteredMentees.map((mentee) => (
                                <div key={mentee.id} className="tw-p-4">
                                    <MenteeRosterRow
                                        mentee={mentee}
                                        onViewProgress={() => setSelectedMenteeId(mentee.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mentee Progress Modal */}
            <MenteeProgressModal
                open={!!selectedMenteeId}
                onClose={() => setSelectedMenteeId(null)}
                menteeId={selectedMenteeId || ''}
                menteeName={selectedMentee?.name}
                menteeAvatar={selectedMentee?.avatar}
            />
        </DashboardLayout>
    );
};

export default MentorRosterPage;