import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminUserManagementPanel from '../../components/admin/AdminUserManagementPanel';
import { PageHeader } from '../../components/ui';

const AdminUsersPage: React.FC = () => {
    return (
        <AdminLayout>
            <div className="tw-space-y-6">
                <PageHeader 
                    title="User Accounts"
                    description="Review every mentor and mentee account, approve new registrations, and deactivate access when policies are violated."
                />

                <section aria-label="Admin user management panel">
                    <AdminUserManagementPanel />
                </section>
            </div>
        </AdminLayout>
    );
};

export default AdminUsersPage;
