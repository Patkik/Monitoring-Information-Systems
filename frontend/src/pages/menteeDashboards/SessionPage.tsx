import React, { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import UpcomingSessionsTable from '../../components/mentee/UpcomingSessionsTable';
import SessionHistoryTable from '../../components/mentee/SessionHistoryTable';
import PendingFeedbackList from '../../components/mentee/PendingFeedbackList';
import SessionActionsPanel from '../../components/mentee/SessionActionsPanel';
import ProgressDashboard from '../../components/mentee/ProgressDashboard';
import ChatWindow from '../../components/chat/ChatWindow';
import ChatThreadList from '../../components/chat/ChatThreadList';

type SessionTab = 'sessions' | 'chat';

const SessionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SessionTab>('sessions');

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
            Manage actions, stay ahead of upcoming meetings, close feedback loops, and communicate with your mentor.
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="tw-relative tw-z-10 tw-mt-6 tw-flex tw-gap-1 tw-bg-gray-100 tw-rounded-xl tw-p-1 tw-w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`tw-px-5 tw-py-2 tw-rounded-lg tw-text-sm tw-font-semibold tw-transition-all ${
              activeTab === 'sessions'
                ? 'tw-bg-white tw-text-primary tw-shadow-sm'
                : 'tw-text-gray-600 hover:tw-text-gray-900'
            }`}
          >
            <span className="tw-flex tw-items-center tw-gap-2">
              <svg className="tw-w-4 tw-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Sessions
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`tw-px-5 tw-py-2 tw-rounded-lg tw-text-sm tw-font-semibold tw-transition-all ${
              activeTab === 'chat'
                ? 'tw-bg-white tw-text-primary tw-shadow-sm'
                : 'tw-text-gray-600 hover:tw-text-gray-900'
            }`}
          >
            <span className="tw-flex tw-items-center tw-gap-2">
              <svg className="tw-w-4 tw-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </span>
          </button>
        </div>

        {/* Sessions Tab Content */}
        {activeTab === 'sessions' && (
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
        )}

        {/* Chat Tab Content */}
        {activeTab === 'chat' && (
          <div className="tw-relative tw-z-10 tw-mt-6 tw-grid tw-grid-cols-1 lg:tw-grid-cols-12 tw-gap-5 lg:tw-gap-6" style={{ minHeight: '500px' }}>
            <aside className="lg:tw-col-span-4">
              <div className="tw-bg-white tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-overflow-hidden" style={{ height: '500px' }}>
                <div className="tw-px-4 tw-py-3 tw-border-b tw-border-gray-100 tw-bg-gray-50">
                  <h3 className="tw-text-sm tw-font-bold tw-text-gray-900">Messages</h3>
                  <p className="tw-text-xs tw-text-gray-500">Chat with your mentor</p>
                </div>
                <div className="tw-overflow-y-auto" style={{ height: 'calc(100% - 52px)' }}>
                  <ChatThreadList />
                </div>
              </div>
            </aside>
            <section className="lg:tw-col-span-8">
              <div className="tw-bg-white tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-overflow-hidden" style={{ height: '500px' }}>
                <ChatWindow />
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SessionPage;
