import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import MentorCapacityOverridesPanel from '../../components/admin/MentorCapacityOverridesPanel';

const CapacityPage: React.FC = () => {
    return (
        <AdminLayout>
            <div className="tw-space-y-6">
                <header className="tw-space-y-2">
                    <p className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-purple-600">Admin</p>
                    <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Mentor Capacity</h1>
                    <p className="tw-text-gray-600 tw-leading-6">
                        Manage and override the maximum capacity for mentors.
                    </p>
                </header>
                <section>
                    <MentorCapacityOverridesPanel />
                </section>
            </div>
        </AdminLayout>
    );
};

export default CapacityPage;