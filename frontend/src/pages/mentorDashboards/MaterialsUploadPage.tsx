import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import MaterialUpload from '../../features/materials/MaterialUpload';
import MentorMaterialsList from '../../features/materials/MentorMaterialsList';
import { useMentorSessions } from '../../shared/hooks/useMentorSessions';
import type { MentorSession } from '../../shared/services/sessionsService';

const MaterialsUploadPage: React.FC = () => {
    const { data: sessions = [], isLoading, isError, refetch } = useMentorSessions();
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [materialsFilter, setMaterialsFilter] = useState<string>('all');

    useEffect(() => {
        if (!selectedSessionId && sessions.length > 0) {
            setSelectedSessionId(sessions[0].id);
        }
    }, [sessions, selectedSessionId]);

    const formattedSessions = useMemo(() => {
        return sessions.map((session: MentorSession) => ({
            id: session.id,
            label: `${session.subject || 'Session'} — ${new Date(session.date).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
            })}`,
        }));
    }, [sessions]);

    const handleUploadSuccess = (uploadCount: number) => {
        if (uploadCount > 0 && selectedSessionId) {
            setMaterialsFilter(selectedSessionId);
        }
    };

    return (
        <DashboardLayout>
            <div className="tw-max-w-4xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-10 tw-space-y-8">

                {/* ── Page Header ── */}
                <header>
                    <div className="tw-pl-4 tw-border-l-4 tw-border-primary">
                        <p className="tw-text-xs tw-font-bold tw-tracking-widest tw-text-primary tw-uppercase tw-mb-1">
                            Resources
                        </p>
                        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-leading-tight">
                            Class Materials
                        </h1>
                        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                            Upload handouts, slide decks, and reference files to share with your mentees.
                        </p>
                    </div>
                </header>

                {/* ── Upload Section ── */}
                <section className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm tw-overflow-hidden">
                    <div className="tw-px-6 tw-py-4 tw-border-b tw-border-gray-50">
                        <h2 className="tw-text-sm tw-font-bold tw-text-gray-800">Upload files</h2>
                        <p className="tw-text-xs tw-text-gray-400 tw-mt-0.5">Attach materials to a specific session.</p>
                    </div>
                    <div className="tw-p-6 tw-space-y-5">
                        <div>
                            <label htmlFor="session-select" className="tw-block tw-text-xs tw-font-bold tw-tracking-wide tw-uppercase tw-text-gray-500 tw-mb-2">
                                Select session
                            </label>

                            {isLoading && (
                                <div className="tw-h-10 tw-bg-gray-100 tw-rounded-lg tw-animate-pulse" />
                            )}

                            {isError && (
                                <div className="tw-bg-red-50 tw-border tw-border-red-100 tw-rounded-lg tw-p-3" role="alert">
                                    <p className="tw-text-sm tw-text-red-700 tw-font-medium">Unable to load your sessions.</p>
                                    <button
                                        type="button"
                                        onClick={() => refetch()}
                                        className="tw-mt-1.5 tw-text-xs tw-font-semibold tw-text-red-600 hover:tw-text-red-800 tw-underline"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {!isLoading && !isError && formattedSessions.length === 0 && (
                                <p className="tw-text-sm tw-text-gray-400 tw-italic">
                                    No scheduled sessions yet. Once a session is created, you can attach materials here.
                                </p>
                            )}

                            {!isLoading && !isError && formattedSessions.length > 0 && (
                                <select
                                    id="session-select"
                                    className="tw-block tw-w-full tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-px-3 tw-py-2.5 tw-text-sm tw-text-gray-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-colors"
                                    value={selectedSessionId}
                                    onChange={(e) => setSelectedSessionId(e.target.value)}
                                    aria-label="Choose which session to attach materials to"
                                >
                                    <option value="" disabled>Choose a session</option>
                                    {formattedSessions.map((s) => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {selectedSessionId && formattedSessions.length > 0 && (
                            <MaterialUpload sessionId={selectedSessionId} onUploadSuccess={handleUploadSuccess} />
                        )}
                    </div>
                </section>

                {/* ── Manage Files Section ── */}
                <section className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm tw-overflow-hidden">
                    <div className="tw-px-6 tw-py-4 tw-border-b tw-border-gray-50 tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-3">
                        <div>
                            <h2 className="tw-text-sm tw-font-bold tw-text-gray-800">Manage files</h2>
                            <p className="tw-text-xs tw-text-gray-400 tw-mt-0.5">Download or remove shared materials.</p>
                        </div>
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <label htmlFor="materials-filter" className="tw-text-xs tw-font-bold tw-text-gray-400 tw-uppercase tw-tracking-wide">
                                Filter
                            </label>
                            <select
                                id="materials-filter"
                                className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-text-gray-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-transition-colors"
                                value={materialsFilter}
                                onChange={(e) => setMaterialsFilter(e.target.value)}
                            >
                                <option value="all">All sessions</option>
                                {formattedSessions.map((s) => (
                                    <option key={`filter-${s.id}`} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="tw-p-6">
                        <MentorMaterialsList sessionId={materialsFilter === 'all' ? undefined : materialsFilter} />
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};

export default MaterialsUploadPage;
