import React from 'react';
import { useMatchSuggestions, useCapacityInfo, useAcceptMatch, useDeclineMatch } from '../hooks/useMatchSuggestions';
import MatchCard from '../components/MatchCard';

const MentorDashboardSuggestions: React.FC<{ mentorId?: string }> = ({ mentorId }) => {
  const { data, isLoading, refetch } = useMatchSuggestions(mentorId, 3);
  const capacityInfo = useCapacityInfo(data?.meta);
  const acceptMutation = useAcceptMatch(mentorId, 3);
  const declineMutation = useDeclineMatch(mentorId, 3);

  const suggestions = data?.suggestions ?? [];
  // note: use individual mutation state for button disabled rendering (isPending provided by hooks)

  if (!mentorId) return null;

  return (
    <section aria-labelledby="mentor-suggestions-heading" className="tw-space-y-4">
      <header className="tw-flex tw-justify-between tw-items-start tw-gap-4">
        <div>
          <h2 id="mentor-suggestions-heading" className="tw-text-lg tw-font-semibold tw-text-gray-900">Suggested mentees</h2>
          <p className="tw-text-sm tw-text-gray-500">Top matches for you — quick actions available.</p>
        </div>
        <div className="tw-text-sm tw-text-gray-500 tw-space-y-1">
          <p>Remaining: {capacityInfo.remaining ?? '—'}</p>
          <button onClick={() => refetch()} className="tw-text-purple-600 hover:tw-text-purple-700">Refresh</button>
        </div>
      </header>

      {isLoading ? (
        <p className="tw-text-sm tw-text-gray-500">Loading suggestions…</p>
      ) : (
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          {suggestions.length === 0 ? (
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-p-4 tw-text-sm tw-text-gray-500">No suggestions available right now.</div>
          ) : suggestions.map((s) => (
            <MatchCard
              key={s.id}
              suggestion={s}
              onAccept={() => acceptMutation.mutate({ matchId: s.id })}
              onDecline={() => declineMutation.mutate({ matchId: s.id })}       
              disableAccept={capacityInfo.remaining !== null && capacityInfo.remaining <= 0 && s.status !== 'mentor_accepted'}
              isAccepting={acceptMutation.isPending && acceptMutation.variables?.matchId === s.id}
              isDeclining={declineMutation.isPending && declineMutation.variables?.matchId === s.id}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MentorDashboardSuggestions;
