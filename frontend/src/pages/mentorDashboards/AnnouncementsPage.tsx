import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import AnnouncementsList from '../../components/mentee/AnnouncementsList';

export const MentorAnnouncementsPage: React.FC = () => (
    <DashboardLayout>
        <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-10 tw-space-y-8">
            <header>
                <div className="tw-pl-4 tw-border-l-4 tw-border-primary">
                    <p className="tw-text-xs tw-font-bold tw-tracking-widest tw-text-primary tw-uppercase tw-mb-1">
                        Mentor hub
                    </p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-leading-tight">
                        Program Announcements
                    </h1>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                        Session updates, mentee milestones, and system notices curated for mentors.
                    </p>
                </div>
            </header>
            <AnnouncementsList />
        </div>
    </DashboardLayout>
);

export default MentorAnnouncementsPage;
