import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { PageHeader } from '../ui';
import AdminReportDashboard from '../admin/AdminReportDashboard';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div className="tw-space-y-6">
        <PageHeader 
          title="Admin Dashboard" 
          description="Review mentor and mentee applications and oversee platform management tasks."
        />

        <section id="reports" className="tw-scroll-mt-24">
          <AdminReportDashboard />
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
