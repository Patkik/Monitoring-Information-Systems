import React, { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import MentorSessionsManager from '../../components/mentor/MentorSessionsManager';
import MentorRecognitionPanel from '../../components/mentor/MentorRecognitionPanel';
import ChatPanel from '../../components/chat/ChatPanel';

type SessionTab = 'sessions' | 'chat';

const MentorSessionsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SessionTab>('sessions');

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
                            Session Management
                        </h1>
                        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                            Review upcoming meetings, capture outcomes, and communicate with your mentees.
                        </p>
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="tw-flex tw-gap-1 tw-bg-gray-100 tw-rounded-xl tw-p-1 tw-w-fit">
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
                            Chat with Mentees
                        </span>
                    </button>
                </div>

                {/* Sessions Tab */}
                {activeTab === 'sessions' && (
                    <div className="tw-space-y-8">
                        {/* ── Recognition Panel ── */}
                        <MentorRecognitionPanel />

                        {/* ── Sessions Manager ── */}
                        <MentorSessionsManager />
                    </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                    <div className="tw-mt-8">
                        <ChatPanel />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MentorSessionsPage;
