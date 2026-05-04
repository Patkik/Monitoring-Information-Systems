import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminUserManagementPanel from '../../components/admin/AdminUserManagementPanel';

const AdminUsersPage: React.FC = () => {
    return (
        <AdminLayout>
            <div className="tw-space-y-6">
                <header className="tw-flex tw-flex-col tw-gap-2">
                    <p className="tw-text-sm tw-uppercase tw-tracking-wide tw-text-purple-600 tw-font-semibold">Admin</p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">User Accounts</h1>
                    <p className="tw-text-gray-600 tw-leading-6">
                        Review every mentor and mentee account, approve new registrations, and deactivate access when policies are
                        violated.
                    </p>
                </header>

                <section aria-label="Admin user management panel">
                    <AdminUserManagementPanel />
                </section>
            </div>
        </AdminLayout>
    );
};

export default AdminUsersPage;
