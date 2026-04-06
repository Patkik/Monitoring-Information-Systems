import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import UpcomingSessionsTable from '../../components/mentee/UpcomingSessionsTable';
import SessionHistoryTable from '../../components/mentee/SessionHistoryTable';
import PendingFeedbackList from '../../components/mentee/PendingFeedbackList';
import SessionActionsPanel from '../../components/mentee/SessionActionsPanel';
import ProgressDashboard from '../../components/mentee/ProgressDashboard';

const SessionPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="tw-relative tw-isolate tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        <div aria-hidden="true" className="tw-pointer-events-none tw-absolute tw-inset-x-6 tw-top-4 tw-h-48 tw-rounded-3xl tw-bg-gradient-to-r tw-from-primary/10 tw-via-sky-100/40 tw-to-emerald-100/50" />
        <div aria-hidden="true" className="tw-pointer-events-none tw-absolute tw-right-12 tw-top-28 tw-h-28 tw-w-28 tw-rounded-full tw-bg-primary/10 tw-blur-2xl" />

        <header className="tw-relative tw-z-10">
          <p className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-white/80 tw-px-3 tw-py-1 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary tw-shadow-sm tw-ring-1 tw-ring-primary/20">
            Session Hub
          </p>
          <h1 className="tw-mt-3 tw-text-3xl md:tw-text-4xl tw-font-bold tw-tracking-tight tw-text-gray-900">Your mentoring sessions at a glance</h1>
          <p className="tw-mt-2 tw-max-w-3xl tw-text-sm sm:tw-text-base tw-text-gray-600">
            Manage actions, stay ahead of upcoming meetings, close feedback loops, and track long-term momentum from one page.
          </p>
        </header>

        <div className="tw-relative tw-z-10 tw-mt-6 tw-grid tw-grid-cols-1 lg:tw-grid-cols-12 tw-gap-5 lg:tw-gap-6 tw-items-start">
          <section className="lg:tw-col-span-8">
            <SessionActionsPanel />
          </section>

          <aside className="lg:tw-col-span-4 lg:tw-row-span-2">
            <ProgressDashboard />
          </aside>

          <section className="lg:tw-col-span-8">
            <UpcomingSessionsTable />
          </section>

          <section className="lg:tw-col-span-5">
            <PendingFeedbackList />
          </section>

          <section className="lg:tw-col-span-7">
            <SessionHistoryTable />
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SessionPage;

