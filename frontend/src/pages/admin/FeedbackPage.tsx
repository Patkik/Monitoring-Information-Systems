import React from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminFeedbackDashboard from '../../components/admin/AdminFeedbackDashboard';

const FeedbackPage: React.FC = () => {
    return (
        <AdminLayout>
            <div >
                <AdminFeedbackDashboard />
            </div>
        </AdminLayout>
    );
};

export default FeedbackPage;
