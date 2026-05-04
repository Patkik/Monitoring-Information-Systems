import React, { useMemo, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import OverviewMetrics from '../mentor/OverviewMetrics';
import MentorRequestsTable from '../mentor/MentorRequestsTable';
import MentorDashboardSuggestions from '../../features/matchmaking/components/MentorDashboardSuggestions';

// ── Simple Calendar Component ──────────────────────────────────────────────

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const MiniCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = useMemo(() => new Date(), []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  // Build calendar grid (6 weeks × 7 days)
  const cells: { day: number; currentMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false });
  }

  return (
    <div className="tw-bg-white tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-5">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <button type="button" onClick={prevMonth}
          className="tw-h-8 tw-w-8 tw-rounded-lg tw-bg-gray-100 hover:tw-bg-gray-200 tw-flex tw-items-center tw-justify-center tw-transition-colors"
          aria-label="Previous month">
          <svg className="tw-w-4 tw-h-4 tw-text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="tw-text-center">
          <h3 className="tw-text-sm tw-font-bold tw-text-gray-900">{MONTHS[month]} {year}</h3>
          <button type="button" onClick={goToday}
            className="tw-text-[10px] tw-text-primary tw-font-semibold tw-uppercase tw-tracking-wide hover:tw-underline">
            Today
          </button>
        </div>
        <button type="button" onClick={nextMonth}
          className="tw-h-8 tw-w-8 tw-rounded-lg tw-bg-gray-100 hover:tw-bg-gray-200 tw-flex tw-items-center tw-justify-center tw-transition-colors"
          aria-label="Next month">
          <svg className="tw-w-4 tw-h-4 tw-text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="tw-grid tw-grid-cols-7 tw-gap-px">
        {WEEKDAYS.map(d => (
          <div key={d} className="tw-text-[10px] tw-font-bold tw-text-gray-400 tw-uppercase tw-text-center tw-pb-2">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`tw-h-9 tw-flex tw-items-center tw-justify-center tw-text-sm tw-rounded-lg tw-transition-colors ${
              !cell.currentMonth
                ? 'tw-text-gray-300'
                : isToday(cell.day)
                ? 'tw-bg-primary tw-text-white tw-font-bold tw-shadow-sm'
                : 'tw-text-gray-700 hover:tw-bg-purple-50 tw-cursor-pointer'
            }`}
          >
            {cell.day}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Quick Stats Cards ──────────────────────────────────────────────────────

const QuickStatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className={`tw-rounded-2xl tw-border tw-border-gray-100 tw-p-5 tw-bg-white tw-shadow-sm`}>
    <div className="tw-flex tw-items-center tw-gap-3">
      <div className={`tw-h-10 tw-w-10 tw-rounded-xl ${color} tw-flex tw-items-center tw-justify-center tw-flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="tw-text-2xl tw-font-bold tw-text-gray-900">{value}</p>
        <p className="tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wide">{label}</p>
      </div>
    </div>
  </div>
);

// ── Main Dashboard ─────────────────────────────────────────────────────────

const MentorDashboard: React.FC = () => {
  const storedUser = React.useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const mentorId = storedUser?._id || storedUser?.id || storedUser?.user?._id;
  const displayName = useMemo(() => {
    if (!storedUser) return 'Mentor';
    const parts = [storedUser.firstname, storedUser.lastname].filter(Boolean);
    return parts.length ? parts.join(' ') : 'Mentor';
  }, [storedUser]);

  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-space-y-6">

        {/* ── Welcome Header ── */}
        <header className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-end sm:tw-justify-between tw-gap-4">
          <div>
            <p className="tw-text-xs tw-font-bold tw-tracking-widest tw-text-primary tw-uppercase tw-mb-1">
              Welcome back
            </p>
            <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">
              Hello, {displayName} 👋
            </h1>
            <p className="tw-text-gray-600 tw-leading-6 tw-text-sm tw-mt-1">
              Track incoming mentorship requests, manage your sessions, and stay on top of your schedule.
            </p>
          </div>
        </header>

        {/* ── Quick Stats ── */}
        <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
          <QuickStatCard
            label="Active Mentees"
            value="—"
            color="tw-bg-purple-100"
            icon={<svg className="tw-w-5 tw-h-5 tw-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          />
          <QuickStatCard
            label="Sessions This Week"
            value="—"
            color="tw-bg-blue-100"
            icon={<svg className="tw-w-5 tw-h-5 tw-text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <QuickStatCard
            label="Pending Requests"
            value="—"
            color="tw-bg-amber-100"
            icon={<svg className="tw-w-5 tw-h-5 tw-text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <QuickStatCard
            label="Completed Sessions"
            value="—"
            color="tw-bg-emerald-100"
            icon={<svg className="tw-w-5 tw-h-5 tw-text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>

        {/* ── Main Grid: Content + Sidebar ── */}
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-12 tw-gap-6 tw-items-start">

          {/* Main Content Area */}
          <div className="lg:tw-col-span-8 tw-space-y-6">
            {/* Mentorship Requests */}
            <section aria-labelledby="mentor-requests-heading" className="tw-space-y-4">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <h2 id="mentor-requests-heading" className="tw-text-xl tw-font-semibold tw-text-gray-900">Mentorship Requests</h2>
                  <p className="tw-text-sm tw-text-gray-500">Review new requests and accept or decline with a suggested first session slot.</p>
                </div>
              </div>
              <MentorRequestsTable />
            </section>

            {/* Match Suggestions */}
            <section aria-labelledby="mentor-suggestions-heading" className="tw-space-y-4">
              <MentorDashboardSuggestions mentorId={mentorId} />
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:tw-col-span-4 tw-space-y-6">
            {/* Calendar */}
            <section aria-labelledby="calendar-heading">
              <h2 id="calendar-heading" className="tw-text-sm tw-font-bold tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-3">
                Calendar
              </h2>
              <MiniCalendar />
            </section>

            {/* Feedback Overview */}
            <section aria-labelledby="mentor-overview-heading" className="tw-space-y-3">
              <h2 id="mentor-overview-heading" className="tw-text-sm tw-font-bold tw-text-gray-500 tw-uppercase tw-tracking-wide">
                Feedback Overview
              </h2>
              <OverviewMetrics />
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default React.memo(MentorDashboard);
