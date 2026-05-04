import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import ApplicationReviewPanel from '../../components/admin/ApplicationReviewPanel';

const AdminApplicationsPage: React.FC = () => {
    return (
        <AdminLayout>
            <div className="tw-space-y-6">
                <header className="tw-flex tw-flex-col tw-gap-2">
                    <p className="tw-text-sm tw-uppercase tw-tracking-wide tw-text-purple-600 tw-font-semibold">Admin</p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Application Review</h1>
                    <p className="tw-text-gray-600 tw-leading-6">
                        Manage every mentee and mentor application, apply filters, and finalize approvals from a dedicated workspace.
                    </p>
                </header>

                <section aria-label="Application review panel">
                    <ApplicationReviewPanel />
                </section>
            </div>
        </AdminLayout>
    );
};

export default AdminApplicationsPage;
