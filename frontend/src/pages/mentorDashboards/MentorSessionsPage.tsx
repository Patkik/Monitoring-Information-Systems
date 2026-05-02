import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import MentorSessionsManager from '../../components/mentor/MentorSessionsManager';
import MentorRecognitionPanel from '../../components/mentor/MentorRecognitionPanel';

const MentorSessionsPage: React.FC = () => (
    <DashboardLayout>
        <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-10 tw-space-y-8">

            {/* ── Page Header ── */}
            <header className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-end sm:tw-justify-between tw-gap-4">
                <div className="tw-pl-4 tw-border-l-4 tw-border-primary">
                    <p className="tw-text-xs tw-font-bold tw-tracking-widest tw-text-primary tw-uppercase tw-mb-1">
                        Mentor workspace
                    </p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-leading-tight">
                        Session Management
                    </h1>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                        Review upcoming meetings, capture outcomes, and open feedback for your mentees.
                    </p>
                </div>
            </header>

            {/* ── Recognition Panel ── */}
            <MentorRecognitionPanel />

            {/* ── Sessions Manager ── */}
            <MentorSessionsManager />
        </div>
    </DashboardLayout>
);

export default MentorSessionsPage;
