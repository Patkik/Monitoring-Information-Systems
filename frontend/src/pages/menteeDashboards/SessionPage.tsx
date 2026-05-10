import React, { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import UpcomingSessionsTable from '../../components/mentee/UpcomingSessionsTable';
import SessionHistoryTable from '../../components/mentee/SessionHistoryTable';
import PendingFeedbackList from '../../components/mentee/PendingFeedbackList';
import SessionActionsPanel from '../../components/mentee/SessionActionsPanel';
import ProgressDashboard from '../../components/mentee/ProgressDashboard';
import ChatPanel from '../../components/chat/ChatPanel';

type SessionTab = 'sessions' | 'chat';

const SessionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SessionTab>('sessions');

  return (
    <DashboardLayout>
      <div className="tw-relative tw-isolate tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        {/* Subtle page background tint */}
        <div
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-h-40 tw-bg-gradient-to-b tw-from-violet-50/60 tw-to-transparent tw-rounded-3xl"
        />

        {/* Page header */}
        <header className="tw-relative tw-z-10">
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary/10 tw-px-3 tw-py-1 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-primary">
            Session Hub
          </span>
          <h1 className="tw-mt-2 tw-text-2xl md:tw-text-3xl tw-font-bold tw-tracking-tight tw-text-gray-900">
            Your mentoring sessions at a glance
          </h1>
          <p className="tw-mt-1 tw-max-w-2xl tw-text-sm tw-text-gray-500">
            Manage actions, stay ahead of upcoming meetings, close feedback loops, and communicate with your mentor.
          </p>
        </header>

        {/* Tab strip */}
        <div className="tw-relative tw-z-10 tw-mt-5 tw-inline-flex tw-gap-1 tw-bg-gray-100 tw-rounded-xl tw-p-1">
          {(['sessions', 'chat'] as SessionTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-semibold tw-transition-all ${
                activeTab === tab
                  ? 'tw-bg-white tw-text-primary tw-shadow-sm'
                  : 'tw-text-gray-500 hover:tw-text-gray-800'
              }`}
            >
              {tab === 'sessions' ? (
                <svg className="tw-w-4 tw-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="tw-w-4 tw-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Sessions content */}
        {activeTab === 'sessions' && (
          <div className="tw-relative tw-z-10 tw-mt-6 tw-flex tw-flex-col lg:tw-flex-row tw-gap-6 tw-items-start">
            {/* Main column */}
            <div className="tw-flex tw-flex-col tw-gap-5 tw-flex-1 tw-min-w-0">
              <SessionActionsPanel />
              <UpcomingSessionsTable />
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-5">
                <PendingFeedbackList />
                <SessionHistoryTable />
              </div>
            </div>

            {/* Sidebar: fixed-width, sticky */}
            <aside className="tw-w-full lg:tw-w-80 xl:tw-w-96 tw-flex-shrink-0 lg:tw-sticky lg:tw-top-20">
              <ProgressDashboard />
            </aside>
          </div>
        )}

        {/* Chat content */}
        {activeTab === 'chat' && (
          <div className="tw-relative tw-z-10 tw-mt-6">
            <ChatPanel />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SessionPage;
