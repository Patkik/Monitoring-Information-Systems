import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import ApplicationReviewPanel from '../../components/admin/ApplicationReviewPanel';
import { PageHeader } from '../../components/ui';
const AdminApplicationsPage: React.FC = () => {
    return (
        <AdminLayout>
            <div className="tw-space-y-6">
                <PageHeader 
                    badge="Admin"
                    title="Application Review"
                    description="Manage every mentee and mentor application, apply filters, and finalize approvals from a dedicated workspace."
                />

                <section aria-label="Application review panel">
                    <ApplicationReviewPanel />
                </section>
            </div>
        </AdminLayout>
    );
};

export default AdminApplicationsPage;
