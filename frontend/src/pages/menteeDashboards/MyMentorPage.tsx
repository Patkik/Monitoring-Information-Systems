import React, { useCallback, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PendingFeedbackList from '../../components/mentee/PendingFeedbackList';
import { useMentorshipRequests } from '../../features/mentorship/hooks/useMentorshipRequests';
import MaterialsLibrary from '../../features/materials/MaterialsLibrary';
import type { MentorshipRequest, MentorshipRequestStatus } from '../../shared/services/mentorMatching';

const statusStyles: Record<MentorshipRequestStatus, string> = {
  pending: 'tw-bg-yellow-100 tw-text-yellow-800',
  accepted: 'tw-bg-green-100 tw-text-green-800',
  declined: 'tw-bg-red-100 tw-text-red-800',
  withdrawn: 'tw-bg-gray-100 tw-text-gray-700'
};

const statusLabels: Record<MentorshipRequestStatus, string> = {
  pending: 'Pending',
  accepted: 'Active match',
  declined: 'Declined',
  withdrawn: 'Withdrawn'
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Not specified';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not specified';
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const MyMentorPage: React.FC = () => {
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const {
    requests,
    isLoading: loadingRequests,
    isRefetching: refetchingRequests,
    refetch: refetchRequests,
    withdrawRequest
  } = useMentorshipRequests('mentee');

  const currentMatches = useMemo(
    () => requests.filter((request) => request.status === 'accepted'),
    [requests]
  );

  const previousMatches = useMemo(
    () => requests.filter((request) => request.status !== 'accepted'),
    [requests]
  );
  const refreshing = refetchingRequests;

  const handleRefresh = useCallback(async () => {
    await refetchRequests();
  }, [refetchRequests]);

  const handleWithdraw = useCallback(async (matchId: string, mentorName: string) => {
    if (!confirm(`Are you sure you want to withdraw your mentorship request with ${mentorName}? This cannot be undone.`)) {
      return;
    }

    setWithdrawingId(matchId);
    try {
      await withdrawRequest(matchId);
    } finally {
      setWithdrawingId(null);
    }
  }, [withdrawRequest]);

  const renderMatchCard = (match: MentorshipRequest) => {
    const mentorName = match.mentor?.name || 'Mentor';
    const mentorEmail = match.mentor?.email || 'No email provided';
    const badgeClass = statusStyles[match.status] || 'tw-bg-gray-100 tw-text-gray-700';
    const statusLabel = statusLabels[match.status] || match.status;

    return (
      <article
        key={match.id}
        className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-p-6 tw-shadow-sm"
      >
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-4">
          <div>
            <h3 className="tw-text-xl tw-font-semibold tw-text-gray-900">{mentorName}</h3>
            <a
              href={`mailto:${mentorEmail}`}
              className="tw-text-sm tw-text-purple-600 hover:tw-text-purple-700"
            >
              {mentorEmail}
            </a>
          </div>
          <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-gap-3">
            <span className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-3 tw-py-1 tw-text-xs tw-font-semibold ${badgeClass}`}>
              {statusLabel}
            </span>
            {match.status === 'pending' && (
              <button
                onClick={() => handleWithdraw(match.id, mentorName)}
                disabled={withdrawingId === match.id}
                className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-red-300 tw-bg-red-50 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-red-700 hover:tw-bg-red-100 disabled:tw-opacity-60 tw-transition-colors"
              >
                {withdrawingId === match.id ? (
                  <>
                    <span className="tw-animate-spin tw-h-3 tw-w-3 tw-border-b-2 tw-border-red-700 tw-rounded-full" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <svg className="tw-h-3 tw-w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Withdraw
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <dl className="tw-mt-4 tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
          <div>
            <dt className="tw-text-xs tw-font-medium tw-text-gray-500">Subject</dt>
            <dd className="tw-text-sm tw-text-gray-900">{match.subject || 'Not specified'}</dd>
          </div>
          <div>
            <dt className="tw-text-xs tw-font-medium tw-text-gray-500">Suggested schedule</dt>
            <dd className="tw-text-sm tw-text-gray-900">{match.sessionSuggestion || 'Coordinate with your mentor'}</dd>
          </div>
          <div>
            <dt className="tw-text-xs tw-font-medium tw-text-gray-500">Matched on</dt>
            <dd className="tw-text-sm tw-text-gray-900">{formatDateTime(match.updatedAt || match.createdAt)}</dd>
          </div>
        </dl>
        {match.goals && (
          <div className="tw-mt-4">
            <p className="tw-text-xs tw-font-medium tw-text-gray-500">Your goals</p>
            <p className="tw-mt-1 tw-text-sm tw-text-gray-900">{match.goals}</p>
          </div>
        )}
      </article>
    );
  };

  const renderMaterialsSection = () => (
    <div className="tw-mt-2">
      <MaterialsLibrary />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-space-y-8">
        <section className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-4">
          <div>
            <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">My Mentor</h1>
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Review your active mentor match and access materials shared specifically for you.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-border-purple-400 disabled:tw-opacity-60"
          >
            {refreshing && (
              <span className="tw-animate-spin tw-h-4 tw-w-4 tw-border-b-2 tw-border-purple-500 tw-rounded-full" aria-hidden="true" />
            )}
            Refresh
          </button>
        </section>

        <section className="tw-space-y-4">
          <header className="tw-flex tw-items-center tw-justify-between">
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900">Current mentor</h2>
            {loadingRequests && (
              <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-500" role="status" aria-live="polite">
                <span className="tw-animate-spin tw-rounded-full tw-h-4 tw-w-4 tw-border-b-2 tw-border-purple-500" />
                Loading mentor data...
              </div>
            )}
          </header>
          {currentMatches.length === 0 && !loadingRequests ? (
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-p-6 tw-text-sm tw-text-gray-600">
              You do not have an active mentor yet. Submit a mentorship request to get matched.
            </div>
          ) : (
            <div className="tw-grid tw-grid-cols-1 tw-gap-4">
              {currentMatches.map((match) => renderMatchCard(match))}
            </div>
          )}
        </section>

        {previousMatches.length > 0 && (
          <section className="tw-space-y-4">
            <header>
              <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900">Mentorship history</h2>
              <p className="tw-text-sm tw-text-gray-600">
                Track previous requests and responses for quick reference.
              </p>
            </header>
            <div className="tw-grid tw-grid-cols-1 tw-gap-4">
              {previousMatches.map((match) => renderMatchCard(match))}
            </div>
          </section>
        )}

        <section className="tw-space-y-4">
          <header>
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900">Shared materials</h2>
            <p className="tw-text-sm tw-text-gray-600">
              Materials uploaded by your mentor and shared with you or your sessions appear here.
            </p>
          </header>
          {renderMaterialsSection()}
        </section>

        <section className="tw-space-y-4">
          <header>
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900">Share session feedback</h2>
            <p className="tw-text-sm tw-text-gray-600">
              Reflect on your recent sessions without leaving this page. Your responses go straight to the mentor and admin review flows.
            </p>
          </header>
          <PendingFeedbackList />
        </section>
      </div>
    </DashboardLayout>
  );
};

export default MyMentorPage;

