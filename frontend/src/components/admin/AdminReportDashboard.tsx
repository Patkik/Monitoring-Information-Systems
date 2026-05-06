import React, { useMemo, useState } from 'react';
import { useAdminReportOverview } from '../../hooks/useAdminReports';
import {
    AdminReportFilters,
    SessionStatus,
    downloadAdminReport,
} from '../../shared/services/reportService';
import { useToast } from '../../hooks/useToast';

type FormStatus = 'all' | SessionStatus;
type FormAttendance = 'all' | 'attended' | 'missed';

interface FormState {
    from?: string;
    to?: string;
    mentorId?: string;
    menteeId?: string;
    topic?: string;
    status: FormStatus;
    attendance: FormAttendance;
}

const statusOptions: Array<{ label: string; value: FormStatus }> = [
    { label: 'All statuses', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Rescheduled', value: 'rescheduled' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Completed', value: 'completed' },
];

const attendanceOptions: Array<{ label: string; value: FormAttendance }> = [
    { label: 'All attendance', value: 'all' },
    { label: 'Attended', value: 'attended' },
    { label: 'Missed', value: 'missed' },
];

const numberFormatter = new Intl.NumberFormat('en-US');
const decimalFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const ratingFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

const formatDateValue = (value?: string | null) => {
    if (!value) {
        return '—';
    }
    try {
        return dateTimeFormatter.format(new Date(value));
    } catch {
        return value;
    }
};

const buildFilterChips = (applied: Record<string, unknown> | undefined) => {
    if (!applied) {
        return [] as Array<{ label: string; value: string }>;
    }

    const chips: Array<{ label: string; value: string }> = [];
    if (applied.from && applied.to) {
        chips.push({ label: 'Range', value: `${dateFormatter.format(new Date(applied.from as string))} – ${dateFormatter.format(new Date(applied.to as string))}` });
    } else if (applied.from) {
        chips.push({ label: 'From', value: dateFormatter.format(new Date(applied.from as string)) });
    } else if (applied.to) {
        chips.push({ label: 'To', value: dateFormatter.format(new Date(applied.to as string)) });
    }

    if (applied.topic) {
        chips.push({ label: 'Topic', value: String(applied.topic) });
    }
    if (applied.mentorId) {
        chips.push({ label: 'Mentor ID', value: String(applied.mentorId) });
    }
    if (applied.menteeId) {
        chips.push({ label: 'Mentee ID', value: String(applied.menteeId) });
    }
    if (Array.isArray(applied.status) && applied.status.length) {
        chips.push({ label: 'Statuses', value: applied.status.join(', ') });
    }
    if (applied.attendance) {
        chips.push({ label: 'Attendance', value: String(applied.attendance) });
    }
    if (applied.defaultRange && !applied.from && !applied.to) {
        chips.push({ label: 'Range', value: `Last ${applied.defaultRange} days` });
    }
    return chips;
};

const AdminReportDashboard: React.FC = () => {
    const defaults: FormState = { status: 'all', attendance: 'all' };
    const [formState, setFormState] = useState<FormState>(defaults);
    const [activeFilters, setActiveFilters] = useState<FormState>(defaults);
    const [exporting, setExporting] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);
    const { showToast } = useToast();

    const normalizedFilters = useMemo<AdminReportFilters>(() => {
        const filters: AdminReportFilters = {};
        if (activeFilters.from) {
            filters.from = activeFilters.from;
        }
        if (activeFilters.to) {
            filters.to = activeFilters.to;
        }
        if (activeFilters.mentorId?.trim()) {
            filters.mentorId = activeFilters.mentorId.trim();
        }
        if (activeFilters.menteeId?.trim()) {
            filters.menteeId = activeFilters.menteeId.trim();
        }
        if (activeFilters.topic?.trim()) {
            filters.topic = activeFilters.topic.trim();
        }
        if (activeFilters.status !== 'all') {
            filters.status = [activeFilters.status];
        }
        if (activeFilters.attendance !== 'all') {
            filters.attendance = activeFilters.attendance;
        }
        return filters;
    }, [activeFilters]);

    const reportQuery = useAdminReportOverview(normalizedFilters);
    const report = reportQuery.data;
    const chips = useMemo(() => buildFilterChips(report?.filters), [report?.filters]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormState((prev) => ({ ...prev, [name]: value || undefined }));
    };

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = event.target;
        setFormState((prev) => ({ ...prev, [name]: value as FormStatus | FormAttendance }));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setActiveFilters(formState);
    };

    const handleReset = () => {
        setFormState(defaults);
        setActiveFilters(defaults);
    };

    const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
        try {
            setExporting(format);
            const blob = await downloadAdminReport(normalizedFilters, format);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mentoring-report.${format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast({ message: `Report downloaded as ${format.toUpperCase()}.`, variant: 'success' });
        } catch (error: any) {
            let message = 'Unable to export report. Please try again.';

            // Handle Blob error response
            if (error?.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    const json = JSON.parse(text);
                    if (json.message) message = json.message;
                } catch {
                    // Fallback to default message if parsing fails
                }
            } else if (error?.response?.data?.message) {
                message = error.response.data.message;
            }

            showToast({ message, variant: 'error' });
        } finally {
            setExporting(null);
        }
    };

    const renderSummaryCards = () => {
        if (!report) {
            return (
                <div className="tw-flex tw-h-32 tw-items-center tw-justify-center">
                    <span className="tw-text-sm tw-text-gray-500">{reportQuery.isLoading ? 'Loading summary…' : 'No data available.'}</span>
                </div>
            );
        }

        const summary = report.summary;
        const satisfaction = report.satisfaction;
        const cards = [
            {
                label: 'Total sessions',
                value: numberFormatter.format(summary.totalSessions),
                detail: `${summary.mentorCount} mentors · ${summary.menteeCount} mentees`,
            },
            {
                label: 'Attendance rate',
                value: `${summary.attendanceRate}%`,
                detail: `${summary.attendedSessions} attended`,
            },
            {
                label: 'Avg duration',
                value: `${decimalFormatter.format(summary.averageDurationMinutes)} min`,
                detail: `${summary.completedSessions} completed`,
            },
            {
                label: 'Mentee rating',
                value: satisfaction.mentee.count ? ratingFormatter.format(satisfaction.mentee.averageRating) : '—',
                detail: `${satisfaction.mentee.count} reviews`,
            },
        ];

        return (
            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 xl:tw-grid-cols-4 tw-gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm">
                        <p className="tw-text-sm tw-font-semibold tw-text-gray-500">{card.label}</p>
                        <p className="tw-mt-2 tw-text-3xl tw-font-bold tw-text-gray-900">{card.value}</p>
                        <p className="tw-mt-1 tw-text-sm tw-text-gray-500">{card.detail}</p>
                    </div>
                ))}
            </div>
        );
    };

    const renderStatusBreakdown = () => {
        if (!report || !report.statusBreakdown.length) {
            return <p className="tw-text-sm tw-text-gray-500">No status data for the current filters.</p>;
        }
        return (
            <ul className="tw-space-y-2">
                {report.statusBreakdown.map((entry) => (
                    <li key={entry.status} className="tw-flex tw-items-center tw-justify-between">
                        <div>
                            <p className="tw-font-semibold tw-text-gray-900">{entry.status}</p>
                            <p className="tw-text-sm tw-text-gray-500">{entry.count} sessions</p>
                        </div>
                        <span className="tw-text-sm tw-font-semibold tw-text-gray-700">{entry.attendanceRate}% attendance</span>
                    </li>
                ))}
            </ul>
        );
    };

    const renderMentorParticipation = () => {
        if (!report || !report.mentorParticipation.length) {
            return <p className="tw-text-sm tw-text-gray-500">No mentor participation data.</p>;
        }
        return (
            <ul className="tw-space-y-2">
                {report.mentorParticipation.map((entry) => (
                    <li key={entry.mentorId ?? entry.mentor?.name} className="tw-flex tw-items-center tw-justify-between">
                        <div>
                            <p className="tw-font-semibold tw-text-gray-900">{entry.mentor?.name ?? 'Mentor'}</p>
                            <p className="tw-text-sm tw-text-gray-500">{entry.totalSessions} sessions</p>
                        </div>
                        <div className="tw-text-right">
                            <p className="tw-text-sm tw-text-gray-700">{entry.attendanceRate}% attendance</p>
                            <p className="tw-text-xs tw-text-gray-500">{entry.completionRate}% completion</p>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    const renderMonthlyTrends = () => {
        if (!report || !report.monthlyTrends.length) {
            return <p className="tw-text-sm tw-text-gray-500">No monthly trend data.</p>;
        }
        return (
            <div className="tw-overflow-x-auto">
                <table className="tw-min-w-full tw-text-left">
                    <thead>
                        <tr>
                            <th className="tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-gray-500">Month</th>
                            <th className="tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-gray-500">Total</th>
                            <th className="tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-gray-500">Completed</th>
                            <th className="tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-gray-500">Attended</th>
                        </tr>
                    </thead>
                    <tbody className="tw-divide-y tw-divide-gray-100">
                        {report.monthlyTrends.map((entry) => (
                            <tr key={entry.month}>
                                <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-900">{entry.month}</td>
                                <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-700">{entry.total}</td>
                                <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-700">{entry.completed}</td>
                                <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-700">{entry.attended}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderRecentSessions = () => {
        if (!report) {
            return null;
        }
        if (!report.recentSessions.length) {
            return <p className="tw-text-sm tw-text-gray-500">No sessions match the current filters.</p>;
        }
        return (
            <div className="tw-overflow-x-auto">
                <table className="tw-min-w-full tw-text-left">
                    <thead className="tw-bg-gray-50">
                        <tr>
                            <th className="tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-gray-500">Session</th>
                            <th className="tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-gray-500">Mentor</th>
                            <th className="tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-gray-500">Mentee</th>
                            <th className="tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-gray-500">Status</th>
                            <th className="tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-gray-500">Ratings</th>
                        </tr>
                    </thead>
                    <tbody className="tw-divide-y tw-divide-gray-100 tw-bg-white">
                        {report.recentSessions.slice(0, 8).map((session) => (
                            <tr key={session.id} className="hover:tw-bg-gray-50">
                                <td className="tw-px-3 tw-py-3">
                                    <p className="tw-font-semibold tw-text-gray-900">{session.subject}</p>
                                    <p className="tw-text-xs tw-text-gray-500">{formatDateValue(session.date)}</p>
                                </td>
                                <td className="tw-px-3 tw-py-3">
                                    <p className="tw-text-sm tw-font-medium tw-text-gray-900">{session.mentor?.name ?? '—'}</p>
                                    <p className="tw-text-xs tw-text-gray-500">{session.mentor?.email ?? '—'}</p>
                                </td>
                                <td className="tw-px-3 tw-py-3">
                                    <p className="tw-text-sm tw-font-medium tw-text-gray-900">{session.mentee?.name ?? '—'}</p>
                                    <p className="tw-text-xs tw-text-gray-500">{session.mentee?.email ?? '—'}</p>
                                </td>
                                <td className="tw-px-3 tw-py-3">
                                    <span className="tw-inline-flex tw-rounded-full tw-bg-gray-100 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-gray-700">
                                        {session.status}
                                    </span>
                                    <p className="tw-mt-1 tw-text-xs tw-text-gray-500">{session.attended ? 'Attended' : 'Not attended'}</p>
                                </td>
                                <td className="tw-px-3 tw-py-3">
                                    <p className="tw-text-sm tw-font-semibold tw-text-gray-900">
                                        {session.menteeRating ?? '—'} / {session.mentorRating ?? '—'}
                                    </p>
                                    <p className="tw-text-xs tw-text-gray-500">Mentee / Mentor</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderRecentFeedback = () => {
        if (!report) {
            return null;
        }
        if (!report.recentFeedback.length) {
            return <p className="tw-text-sm tw-text-gray-500">No feedback captured for the selected filters.</p>;
        }
        return (
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
                {report.recentFeedback.map((item) => (
                    <article key={item.id} className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm">
                        <div className="tw-flex tw-items-center tw-justify-between">
                            <p className="tw-text-base tw-font-semibold tw-text-gray-900">Rating {item.rating}/5</p>
                            <span className={`tw-rounded-full tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold ${item.flagged ? 'tw-bg-red-50 tw-text-red-700' : 'tw-bg-green-50 tw-text-green-700'}`}>
                                {item.flagged ? 'Flagged' : 'Published'}
                            </span>
                        </div>
                        <p className="tw-mt-2 tw-text-sm tw-text-gray-600">{item.comment ?? 'No comment provided.'}</p>
                        <div className="tw-mt-3 tw-text-xs tw-text-gray-500">
                            <p>Mentee: {item.mentee?.name ?? 'Anonymous'}</p>
                            <p>Mentor: {item.mentor?.name ?? '—'}</p>
                            <p>{formatDateValue(item.submittedAt)}</p>
                        </div>
                    </article>
                ))}
            </div>
        );
    };

    return (
        <div className="tw-space-y-6">
            <form onSubmit={handleSubmit} className="tw-grid tw-grid-cols-1 gap-4 rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm lg:tw-grid-cols-4">
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                    From
                    <input
                        type="date"
                        name="from"
                        value={formState.from ?? ''}
                        onChange={handleInputChange}
                        className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-purple-500"
                    />
                </label>
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                    To
                    <input
                        type="date"
                        name="to"
                        value={formState.to ?? ''}
                        onChange={handleInputChange}
                        className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-purple-500"
                    />
                </label>
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                    Mentor ID
                    <input
                        type="text"
                        name="mentorId"
                        placeholder="ObjectId"
                        value={formState.mentorId ?? ''}
                        onChange={handleInputChange}
                        className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-purple-500"
                    />
                </label>
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                    Mentee ID
                    <input
                        type="text"
                        name="menteeId"
                        placeholder="ObjectId"
                        value={formState.menteeId ?? ''}
                        onChange={handleInputChange}
                        className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-purple-500"
                    />
                </label>
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                    Topic contains
                    <input
                        type="text"
                        name="topic"
                        placeholder="Session subject keywords"
                        value={formState.topic ?? ''}
                        onChange={handleInputChange}
                        className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-purple-500"
                    />
                </label>
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                    Status
                    <select
                        name="status"
                        value={formState.status}
                        onChange={handleSelectChange}
                        className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-purple-500"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                    Attendance
                    <select
                        name="attendance"
                        value={formState.attendance}
                        onChange={handleSelectChange}
                        className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-purple-500"
                    >
                        {attendanceOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="tw-col-span-full tw-flex tw-justify-end tw-gap-3">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        className="tw-rounded-lg tw-bg-purple-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700"
                    >
                        Apply filters
                    </button>
                </div>
            </form>

            <div className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm">
                <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                    <div>
                        <p className="tw-text-sm tw-font-semibold tw-text-purple-600">Report filters</p>
                        <p className="tw-text-xs tw-text-gray-500">Summaries refresh automatically after filters change.</p>
                    </div>
                    <div className="tw-flex tw-gap-2">
                        <button
                            type="button"
                            onClick={() => handleExport('csv')}
                            disabled={exporting !== null}
                            className="tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50 disabled:tw-opacity-60"
                        >
                            {exporting === 'csv' ? 'Preparing CSV…' : 'Export CSV'}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleExport('xlsx')}
                            disabled={exporting !== null}
                            className="tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50 disabled:tw-opacity-60"
                        >
                            {exporting === 'xlsx' ? 'Preparing XLSX…' : 'Export XLSX'}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleExport('pdf')}
                            disabled={exporting !== null}
                            className="tw-rounded-lg tw-bg-purple-600 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700 disabled:tw-opacity-60"
                        >
                            {exporting === 'pdf' ? 'Preparing PDF…' : 'Export PDF'}
                        </button>
                    </div>
                </div>
                <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
                    {chips.length ? (
                        chips.map((chip) => (
                            <span key={`${chip.label}-${chip.value}`} className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-gray-100 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-gray-700">
                                {chip.label}: {chip.value}
                            </span>
                        ))
                    ) : (
                        <span className="tw-text-xs tw-text-gray-500">No filters applied (default 90-day window).</span>
                    )}
                </div>
            </div>

            <section aria-label="Report summary" className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm">
                {reportQuery.isError && !report ? (
                    <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
                        <div>
                            <p className="tw-font-semibold tw-text-red-600">Unable to load report data.</p>
                            <p className="tw-text-sm tw-text-gray-600">Please refresh the page or adjust the filters.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => reportQuery.refetch()}
                            className="tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    renderSummaryCards()
                )}
            </section>

            <div className="tw-grid tw-grid-cols-1 gap-4 lg:tw-grid-cols-3">
                <section className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm">
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-900">Status breakdown</p>
                    <div className="tw-mt-3">{renderStatusBreakdown()}</div>
                </section>
                <section className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm">
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-900">Top mentors</p>
                    <div className="tw-mt-3">{renderMentorParticipation()}</div>
                </section>
                <section className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm">
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-900">Monthly trends</p>
                    <div className="tw-mt-3">{renderMonthlyTrends()}</div>
                </section>
            </div>

            <section className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between">
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-900">Recent sessions</p>
                    {reportQuery.isFetching && <span className="tw-text-xs tw-text-gray-500">Refreshing…</span>}
                </div>
                <div className="tw-mt-3">{renderRecentSessions()}</div>
            </section>

            <section className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-p-4 tw-shadow-sm">
                <p className="tw-text-sm tw-font-semibold tw-text-gray-900">Recent feedback</p>
                <div className="tw-mt-3">{renderRecentFeedback()}</div>
            </section>
        </div>
    );
};

export default AdminReportDashboard;
