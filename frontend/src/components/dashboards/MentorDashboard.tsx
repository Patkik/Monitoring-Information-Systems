import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import OverviewMetrics from '../mentor/OverviewMetrics';
import MentorRequestsTable from '../mentor/MentorRequestsTable';
import MentorDashboardSuggestions from '../../features/matchmaking/components/MentorDashboardSuggestions';
import { SidebarMainLayout } from '../../shared/components';

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
  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-space-y-8">
        <header className="tw-flex tw-flex-col tw-gap-2">
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Mentor Dashboard</h1>
          <p className="tw-text-gray-600 tw-leading-6 tw-text-sm">
            Track incoming mentorship requests, manage your sessions, and navigate quick tools.
          </p>
        </header>

        <SidebarMainLayout
          className="tw-items-start"
          sidebar={(
            <div className="tw-space-y-8">
              {/* Metrics Overview (placeholder – extend with real data hook later) */}
              <section aria-labelledby="mentor-overview-heading" className="tw-space-y-4">
                <h2 id="mentor-overview-heading" className="tw-text-xl tw-font-semibold tw-text-gray-900">Overview</h2>
                <OverviewMetrics />
              </section>

              {/* Match suggestions */}
              <section aria-labelledby="mentor-suggestions-heading" className="tw-space-y-4">
                <MentorDashboardSuggestions mentorId={mentorId} />
              </section>
            </div>
          )}
          main={(
            <section aria-labelledby="mentor-requests-heading" className="tw-space-y-4">
              <h2 id="mentor-requests-heading" className="tw-text-xl tw-font-semibold tw-text-gray-900">Mentorship Requests</h2>
              <p className="tw-text-sm tw-text-gray-500">Review new requests and accept or decline with a suggested first session slot.</p>
              <MentorRequestsTable />
            </section>
          )}
        />
      </div>
    </DashboardLayout>
  );
};

export default React.memo(MentorDashboard);
