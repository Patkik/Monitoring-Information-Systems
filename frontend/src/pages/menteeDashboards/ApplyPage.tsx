import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import CategoryCards from '../../components/mentee/CategoryCards';
import MatchSuggestionsSection from '../../components/mentee/MatchSuggestionsSection';
import MentorDirectorySection from '../../components/mentee/MentorDirectorySection';
import ApplicationForm from '../../components/mentee/ApplicationForm';

const ApplyPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        {/* Title */}
        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mb-8">Apply to a new mentor!</h1>

        {/* Category Cards */}
        <CategoryCards />

        {/* Match Suggestions */}
        <MatchSuggestionsSection limit={5} showHeader={true} />

        {/* Mentor Directory */}
        <MentorDirectorySection />

        {/* Application Form */}
        <ApplicationForm />
      </div>
    </DashboardLayout>
  );
};

export default ApplyPage;

