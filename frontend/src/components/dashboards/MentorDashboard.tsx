import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import OverviewMetrics from '../mentor/OverviewMetrics';
import MentorRequestsTable from '../mentor/MentorRequestsTable';
import MentorDashboardSuggestions from '../../features/matchmaking/components/MentorDashboardSuggestions';
import { useMentorSessions } from '../../shared/hooks/useMentorSessions';
import { PageHeader, StatCard } from '../ui';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock 
} from 'lucide-react';

// ── Simple Calendar Component ──────────────────────────────────────────────

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const MiniCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { data: sessions = [] } = useMentorSessions();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const today = useMemo(() => new Date(), []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  const isSelected = (day: number) =>
    selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;

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
    <div className="tw-bg-[var(--surface-card)] tw-rounded-xl tw-border tw-border-[var(--border-color)] tw-shadow-[var(--shadow-sm)] tw-p-5">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <button type="button" onClick={prevMonth}
          className="tw-h-8 tw-w-8 tw-rounded-lg tw-bg-[var(--surface-secondary)] hover:tw-bg-[var(--surface-hover)] tw-flex tw-items-center tw-justify-center tw-transition-colors"
          aria-label="Previous month">
          <svg className="tw-w-4 tw-h-4 tw-text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="tw-text-center">
          <h3 className="tw-text-sm tw-font-bold tw-text-[var(--text-primary)]">{MONTHS[month]} {year}</h3>
          <button type="button" onClick={goToday}
            className="tw-text-[10px] tw-text-primary tw-font-semibold tw-uppercase tw-tracking-wide hover:tw-underline">
            Today
          </button>
        </div>
        <button type="button" onClick={nextMonth}
          className="tw-h-8 tw-w-8 tw-rounded-lg tw-bg-[var(--surface-secondary)] hover:tw-bg-[var(--surface-hover)] tw-flex tw-items-center tw-justify-center tw-transition-colors"
          aria-label="Next month">
          <svg className="tw-w-4 tw-h-4 tw-text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="tw-grid tw-grid-cols-7 tw-gap-px">
        {WEEKDAYS.map(d => (
          <div key={d} className="tw-text-[10px] tw-font-bold tw-text-[var(--text-tertiary)] tw-uppercase tw-text-center tw-pb-2">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const cellDate = new Date(year, month, cell.day);
          const dateStr = cellDate.toLocaleDateString('en-CA'); // YYYY-MM-DD local
          const hasSession = sessions.some(s => {
            const sessionDate = new Date(s.date).toLocaleDateString('en-CA');
            return sessionDate === dateStr;
          });

          return (
            <div
              key={i}
              onClick={() => {
                if (cell.currentMonth) {
                  setSelectedDate(new Date(year, month, cell.day));
                  navigate(`/mentor/sessions?date=${dateStr}`);
                }
              }}
              className={`tw-relative tw-h-9 tw-flex tw-items-center tw-justify-center tw-text-sm tw-rounded-lg tw-transition-colors ${
                !cell.currentMonth
                  ? 'tw-text-[var(--text-muted)]'
                  : isSelected(cell.day)
                  ? 'tw-bg-primary tw-text-white tw-font-bold tw-shadow-sm tw-cursor-pointer'
                  : isToday(cell.day)
                  ? 'tw-text-primary tw-font-bold tw-shadow-sm hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer'
                  : 'tw-text-[var(--text-primary)] hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer'
              }`}
            >
              {cell.day}
              {hasSession && cell.currentMonth && (
                <div className={`tw-absolute tw-bottom-1 tw-w-1 tw-h-1 tw-rounded-full ${isSelected(cell.day) ? 'tw-bg-white' : 'tw-bg-primary'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
    <AdminLayout>
      <div className="tw-space-y-6">
        
        {/* ── Welcome Header ── */}
        <PageHeader 
          badge="Welcome back"
          title={`Hello, ${displayName} 👋`}
          description="Track incoming mentorship requests, manage your sessions, and stay on top of your schedule."
        />

        {/* ── Quick Stats ── */}
        <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
          <StatCard
            label="Active Mentees"
            value="—"
            icon={<Users className="tw-w-5 tw-h-5" />}
          />
          <StatCard
            label="Sessions This Week"
            value="—"
            icon={<Calendar className="tw-w-5 tw-h-5" />}
          />
          <StatCard
            label="Pending Requests"
            value="—"
            icon={<Clock className="tw-w-5 tw-h-5" />}
          />
          <StatCard
            label="Completed Sessions"
            value="—"
            icon={<CheckCircle className="tw-w-5 tw-h-5" />}
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
                  <h2 id="mentor-requests-heading" className="tw-text-xl tw-font-semibold tw-text-[var(--text-primary)]">Mentorship Requests</h2>
                  <p className="tw-text-sm tw-text-[var(--text-secondary)]">Review new requests and accept or decline with a suggested first session slot.</p>
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
              <h2 id="calendar-heading" className="tw-text-sm tw-font-bold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wide tw-mb-3">
                Calendar
              </h2>
              <MiniCalendar />
            </section>

            {/* Feedback Overview */}
            <section aria-labelledby="mentor-overview-heading" className="tw-space-y-3">
              <h2 id="mentor-overview-heading" className="tw-text-sm tw-font-bold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wide">
                Feedback Overview
              </h2>
              <OverviewMetrics />
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default React.memo(MentorDashboard);
