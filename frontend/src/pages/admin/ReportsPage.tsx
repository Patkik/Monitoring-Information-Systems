import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminReportDashboard from '../../components/admin/AdminReportDashboard';

const AdminReportsPage: React.FC = () => {
    return (
        <AdminLayout>
            <div className="tw-space-y-6">
                <header className="tw-space-y-2">
                    <p className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-purple-600">Admin</p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Program Reports</h1>
                    <p className="tw-text-gray-600 tw-leading-6">
                        Monitor participation, satisfaction, and attendance trends. Export filtered data to CSV or PDF for audits and
                        presentations.
                    </p>
                </header>
                <AdminReportDashboard />
            </div>
        </AdminLayout>
    );
};

export default AdminReportsPage;
