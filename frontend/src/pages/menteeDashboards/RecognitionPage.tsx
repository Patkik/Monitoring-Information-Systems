import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import RecognitionPanel from '../../components/mentee/RecognitionPanel';

interface RecognitionStat {
    label: string;
    value: number | string;
    className?: string;
}

const STATS: RecognitionStat[] = [
    { label: 'Certificates', value: 1, className: 'tw-text-green-600'  },
    { label: 'Achievements', value: 1, className: 'tw-text-green-600'  },
    { label: 'In progress',  value: 1, className: 'tw-text-yellow-600' },
];

const RecognitionPage: React.FC = () => (
    <DashboardLayout>
        <div className="tw-min-h-full tw-bg-gray-50">

            {/* ── Page header ───────────────────────────────────────────── */}
            <div className="tw-bg-white tw-border-b tw-border-gray-200">
                <div className="tw-max-w-6xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-5">
                    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-6">

                        {/* Left — identity */}
                        <div className="tw-flex tw-items-center tw-gap-4">
                            <div className="tw-flex-shrink-0 tw-w-10 tw-h-10 tw-rounded-lg tw-bg-primary/10 tw-flex tw-items-center tw-justify-center">
                                <svg
                                    className="tw-w-5 tw-h-5 tw-text-primary"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.75}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                                    />
                                </svg>
                            </div>

                            <div>
                                <p className="tw-text-xs tw-font-semibold tw-tracking-widest tw-text-primary tw-uppercase tw-mb-0.5">
                                    Recognition
                                </p>
                                <h1 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-leading-snug">
                                    Certificates &amp; Achievements
                                </h1>
                                <p className="tw-text-xs tw-text-gray-500 tw-mt-0.5 tw-max-w-md">
                                    Generate certificates, download PDFs, request reissues, and track your achievements in one dedicated space.
                                </p>
                            </div>
                        </div>

                        {/* Right — at-a-glance stats */}
                        <div className="tw-flex tw-gap-3">
                            {STATS.map(({ label, value, className }) => (
                                <div
                                    key={label}
                                    className="tw-bg-gray-50 tw-rounded-lg tw-px-4 tw-py-2.5 tw-text-center tw-min-w-[80px]"
                                >
                                    <p className="tw-text-xs tw-text-gray-400 tw-mb-0.5">{label}</p>
                                    <p className={`tw-text-xl tw-font-semibold tw-text-gray-900 ${className ?? ''}`}>
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>

            {/* ── Page body ─────────────────────────────────────────────── */}
            <div className="tw-max-w-6xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-6 tw-space-y-4">

                {/* Request bar — preserved from original panel */}
                <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-p-5 tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-5">
                    <div className="tw-flex-1 tw-min-w-[220px]">
                        <p className="tw-text-sm tw-font-medium tw-text-gray-900">Request a certificate</p>
                        <p className="tw-text-xs tw-text-gray-500 tw-mt-1 tw-max-w-sm">
                            Choose a certificate type and program, then submit a request for your mentor to sign and issue.
                        </p>
                    </div>
                    <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-3">
                        <div className="tw-flex tw-flex-col tw-gap-1">
                            <label htmlFor="certificate-type" className="tw-text-xs tw-text-gray-500">Certificate type</label>
                            <select id="certificate-type" aria-label="Certificate type" className="tw-text-sm tw-border tw-border-gray-200 tw-rounded-lg tw-px-3 tw-py-1.5 tw-bg-white tw-text-gray-900">
                                <option>Completion</option>
                                <option>Excellence</option>
                            </select>
                        </div>
                        <div className="tw-flex tw-flex-col tw-gap-1">
                            <label htmlFor="program-cohort" className="tw-text-xs tw-text-gray-500">Program / Cohort</label>
                            <select
                                id="program-cohort"
                                aria-label="Program or Cohort"
                                disabled
                                className="tw-text-sm tw-border tw-border-gray-200 tw-rounded-lg tw-px-3 tw-py-1.5 tw-bg-gray-50 tw-text-gray-400 tw-min-w-[180px]"
                            >
                                <option>No completed sessions</option>
                            </select>
                            <span className="tw-text-xs tw-text-gray-400">
                                Complete at least one session to unlock certificate requests.
                            </span>
                        </div>
                        <button
                            disabled
                            className="tw-bg-primary tw-text-white tw-text-sm tw-font-medium tw-px-4 tw-py-2 tw-rounded-lg tw-opacity-50 tw-cursor-not-allowed"
                        >
                            Request certificate
                        </button>
                    </div>
                </div>

                {/* Certificates + Achievements — two-column grid */}
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                    <RecognitionPanel />
                </div>

            </div>
        </div>
    </DashboardLayout>
);

export default RecognitionPage;
