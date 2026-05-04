import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useMentorRoster } from '../../shared/hooks/useMentorRoster';
import MenteeRosterRow from '../../components/mentor/MenteeRosterRow';
import MenteeProgressModal from '../../components/mentor/MenteeProgressModal';

const statusOptions = ['all', 'active', 'inactive', 'paused'] as const;

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
            <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-10 tw-space-y-8">

                {/* ── Page Header ── */}
                <header className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-end sm:tw-justify-between tw-gap-4">
                    <div className="tw-pl-4 tw-border-l-4 tw-border-primary">
                        <p className="tw-text-xs tw-font-bold tw-tracking-widest tw-text-primary tw-uppercase tw-mb-1">
                            Mentor workspace
                        </p>
                        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-leading-tight">
                            My Mentees
                        </h1>
                        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                            {mentees.length > 0
                                ? `${mentees.length} mentee${mentees.length !== 1 ? 's' : ''} in your roster`
                                : 'View and manage your mentee roster'}
                        </p>
                    </div>
                </header>

                {/* ── Filters ── */}
                <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-4">
                    <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4">
                        {/* Search */}
                        <div className="tw-relative tw-flex-1">
                            <svg
                                className="tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-w-4 tw-h-4 tw-text-gray-400 tw-pointer-events-none"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by name or email…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="tw-w-full tw-pl-9 tw-pr-4 tw-py-2.5 tw-border tw-border-gray-200 tw-rounded-lg tw-text-sm tw-text-gray-900 tw-placeholder-gray-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-colors"
                            />
                        </div>

                        {/* Status pills */}
                        <div className="tw-flex tw-items-center tw-gap-1.5 tw-bg-gray-50 tw-rounded-lg tw-p-1">
                            {statusOptions.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-rounded-md tw-transition-all tw-capitalize ${
                                        statusFilter === status
                                            ? 'tw-bg-white tw-text-primary tw-shadow-sm tw-ring-1 tw-ring-gray-200'
                                            : 'tw-text-gray-500 hover:tw-text-gray-800'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Loading ── */}
                {isLoading && (
                    <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-8 tw-space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="tw-h-14 tw-bg-gray-100 tw-rounded-lg tw-animate-pulse" />
                        ))}
                    </div>
                )}

                {/* ── Error ── */}
                {isError && (
                    <div className="tw-bg-red-50 tw-border tw-border-red-100 tw-rounded-xl tw-p-6 tw-text-center">
                        <p className="tw-text-sm tw-font-semibold tw-text-red-700">
                            Unable to load your roster. Please refresh and try again.
                        </p>
                    </div>
                )}

                {/* ── Empty State ── */}
                {!isLoading && !isError && filteredMentees.length === 0 && (
                    <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm tw-py-16 tw-text-center">
                        <div className="tw-w-14 tw-h-14 tw-bg-gray-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4">
                            <svg className="tw-w-7 tw-h-7 tw-text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        </div>
                        <p className="tw-text-base tw-font-semibold tw-text-gray-800">No mentees found</p>
                        <p className="tw-text-sm tw-text-gray-400 tw-mt-1">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters.'
                                : 'You have no mentees assigned yet.'}
                        </p>
                    </div>
                )}

                {/* ── Table ── */}
                {!isLoading && !isError && filteredMentees.length > 0 && (
                    <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm tw-overflow-hidden">
                        {/* Desktop table */}
                        <div className="tw-hidden md:tw-block tw-overflow-x-auto">
                            <table className="tw-w-full tw-text-sm">
                                <thead>
                                    <tr className="tw-border-b tw-border-gray-100">
                                        <th className="tw-text-left tw-px-6 tw-py-4 tw-text-xs tw-font-bold tw-tracking-wider tw-text-gray-400 tw-uppercase">Name</th>
                                        <th className="tw-text-left tw-px-6 tw-py-4 tw-text-xs tw-font-bold tw-tracking-wider tw-text-gray-400 tw-uppercase">Email</th>
                                        <th className="tw-text-left tw-px-6 tw-py-4 tw-text-xs tw-font-bold tw-tracking-wider tw-text-gray-400 tw-uppercase">Status</th>
                                        <th className="tw-text-left tw-px-6 tw-py-4 tw-text-xs tw-font-bold tw-tracking-wider tw-text-gray-400 tw-uppercase">Progress</th>
                                        <th className="tw-text-right tw-px-6 tw-py-4 tw-text-xs tw-font-bold tw-tracking-wider tw-text-gray-400 tw-uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="tw-divide-y tw-divide-gray-50">
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

                        {/* Mobile list */}
                        <div className="md:tw-hidden tw-divide-y tw-divide-gray-50">
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
