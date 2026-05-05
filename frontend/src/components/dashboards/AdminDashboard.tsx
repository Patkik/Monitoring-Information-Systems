import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { PageHeader } from '../ui';
import MentorCapacityOverridesPanel from '../admin/MentorCapacityOverridesPanel';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="tw-space-y-6">
        <PageHeader 
          title="Admin Dashboard" 
          description="Review mentor and mentee applications and oversee platform management tasks."
        />

        <section id="capacity" className="tw-scroll-mt-24">
          <MentorCapacityOverridesPanel />
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
