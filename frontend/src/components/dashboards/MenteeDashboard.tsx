import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import WelcomeBanner from '../mentee/WelcomeBanner';
import PeopleBehind from '../mentee/PeopleBehind';
import MatchNotificationBanner from '../mentee/MatchNotificationBanner';

const MenteeDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="tw-space-y-6">
        {/* Welcome Banner */}
        <WelcomeBanner />

        {/* Mentor Match Notification */}
        <MatchNotificationBanner />

        {/* People Behind This */}
        <PeopleBehind />
      </div>
    </AdminLayout>
  );
};

export default MenteeDashboard;
