import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { exportMenteeSessionsReport } from '../../shared/services/sessionsService';

const SessionActionsPanel: React.FC = () => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleDownload = useCallback(async () => {
        try {
            setIsDownloading(true);
            setStatus(null);

            const response = await exportMenteeSessionsReport();
            const contentType = response.headers['content-type'] || 'text/csv';
            const disposition = response.headers['content-disposition'] || '';
            const filenameMatch = /filename="?([^";]+)"?/i.exec(disposition);
            const filename = filenameMatch?.[1] || 'mentee_sessions.csv';

            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);

            setStatus({ type: 'success', message: 'Session history exported successfully.' });
        } catch (error: any) {
            const apiMessage = error?.response?.data?.message;
            setStatus({ type: 'error', message: apiMessage || 'Unable to export sessions. Please try again.' });
        } finally {
            setIsDownloading(false);
        }
    }, []);

    return (
        <div className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white/95 tw-p-4 sm:tw-p-5 tw-shadow-sm">
            <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center lg:tw-justify-between tw-gap-6">
                <div className="tw-space-y-2">
                    <p className="tw-text-sm tw-font-semibold tw-text-primary tw-uppercase">Sessions</p>
                    <h2 className="tw-text-3xl tw-font-bold tw-text-gray-900">Keep your sessions on track</h2>
                    <p className="tw-text-sm tw-text-gray-600">
                        Message your mentor when you want to set a schedule and keep a personal copy of everything you have completed so far.
                    </p>
                </div>
                <div className="tw-flex tw-flex-wrap tw-gap-3">
                    <Link
                        to="/mentee/chat"
                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-primary tw-text-sm tw-font-semibold tw-text-white tw-px-5 tw-py-2.5 hover:tw-bg-primary/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary"
                    >
                        Message mentor
                    </Link>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-gray-300 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-5 tw-py-2.5 hover:tw-bg-gray-50 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary disabled:tw-opacity-60"
                    >
                        {isDownloading ? 'Preparing CSV…' : 'Download history'}
                    </button>
                </div>
            </div>
            {status ? (
                <div
                    className={`tw-mt-4 tw-rounded-xl tw-border tw-px-4 tw-py-2 tw-text-sm ${
                        status.type === 'success'
                            ? 'tw-border-green-200 tw-bg-green-50 tw-text-green-800'
                            : 'tw-border-red-200 tw-bg-red-50 tw-text-red-700'
                    }`}
                    role="status"
                    aria-live="polite"
                >
                    {status.message}
                </div>
            ) : null}
        </div>
    );
};

export default SessionActionsPanel;
