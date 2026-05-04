import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import MentorCapacityOverridesPanel from '../admin/MentorCapacityOverridesPanel';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="tw-space-y-6">
        <header className="tw-flex tw-flex-col tw-gap-2">
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Admin Dashboard</h1>
          <p className="tw-text-gray-600 tw-leading-6">
            Review mentor and mentee applications and oversee platform management tasks.
          </p>
        </header>

        <section id="capacity" className="tw-scroll-mt-24">
          <MentorCapacityOverridesPanel />
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
