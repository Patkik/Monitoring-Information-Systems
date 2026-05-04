import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminSessionTrackerPanel from '../../components/admin/AdminSessionTrackerPanel';

const AdminSessionsPage: React.FC = () => {
    return (
        <AdminLayout>
            <div className="tw-space-y-6">
                <header className="tw-flex tw-flex-col tw-gap-2">
                    <p className="tw-text-sm tw-uppercase tw-font-semibold tw-tracking-wide tw-text-purple-600">Admin</p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Session Tracker</h1>
                    <p className="tw-text-gray-600 tw-leading-6">
                        Monitor mentoring activity, confirm attendance submissions, and flag sessions that require follow-up.
                    </p>
                </header>

                <section aria-label="Admin session tracker">
                    <AdminSessionTrackerPanel />
                </section>
            </div>
        </AdminLayout>
    );
};

export default AdminSessionsPage;
