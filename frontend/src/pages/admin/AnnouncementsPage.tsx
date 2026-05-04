import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminAnnouncementCenter from '../../components/admin/AdminAnnouncementCenter';

const AdminAnnouncementsPage: React.FC = () => {
    return (
        <AdminLayout>
            <div className="tw-space-y-6">
                <header className="tw-space-y-2">
                    <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-indigo-500">Admin</p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Announcements</h1>
                    <p className="tw-text-gray-600 tw-max-w-3xl">
                        Share platform updates with everyone or target mentors, mentees, and admins with tailored alerts that also feed the
                        mentor and mentee announcement pages.
                    </p>
                </header>
                <AdminAnnouncementCenter />
            </div>
        </AdminLayout>
    );
};

export default AdminAnnouncementsPage;
