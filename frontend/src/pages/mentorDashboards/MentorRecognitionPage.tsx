import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import MentorRecognitionPanel from '../../components/mentor/MentorRecognitionPanel';

interface RecognitionStat {
    label: string;
    value: number | string;
    className?: string;
}

const STATS: RecognitionStat[] = [
    { label: 'Pending',  value: 4,  className: 'tw-text-yellow-600' },
    { label: 'Signed',   value: 12, className: 'tw-text-green-600'  },
    { label: 'Total',    value: 16                                    },
];

export const MentorRecognitionPage: React.FC = () => (
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
                                        d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z"
                                    />
                                </svg>
                            </div>

                            <div>
                                <p className="tw-text-xs tw-font-semibold tw-tracking-widest tw-text-primary tw-uppercase tw-mb-0.5">
                                    Recognition
                                </p>
                                <h1 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-leading-snug">
                                    Verify &amp; Sign Mentee Certificates
                                </h1>
                                <p className="tw-text-xs tw-text-gray-500 tw-mt-0.5 tw-max-w-md">
                                    Review pending signature requests and deliver verified download links to your mentees.
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
            <div className="tw-max-w-6xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-6">
                <MentorRecognitionPanel />
            </div>

        </div>
    </DashboardLayout>
);

export default MentorRecognitionPage;
