import React from 'react';
import { useMatchSuggestions, useCapacityInfo, useAcceptMatch, useDeclineMatch } from '../hooks/useMatchSuggestions';
import MatchCard from '../components/MatchCard';
import { Card, EmptyState, LoadingSpinner } from '../../../components/ui';

const MentorDashboardSuggestions: React.FC<{ mentorId?: string }> = ({ mentorId }) => {
  const { data, isLoading, refetch } = useMatchSuggestions(mentorId, 3);
  const capacityInfo = useCapacityInfo(data?.meta);
  const acceptMutation = useAcceptMatch(mentorId, 3);
  const declineMutation = useDeclineMatch(mentorId, 3);

  const suggestions = data?.suggestions ?? [];
  // note: use individual mutation state for button disabled rendering (isPending provided by hooks)

  if (!mentorId) return null;

  return (
    <Card className="tw-space-y-4">
      <header className="tw-flex tw-justify-between tw-items-start tw-gap-4 tw-mb-4">
        <div>
          <h2 id="mentor-suggestions-heading" className="tw-text-lg tw-font-semibold tw-text-[var(--text-primary)]">Suggested mentees</h2>
          <p className="tw-text-sm tw-text-[var(--text-secondary)]">Top matches for you — quick actions available.</p>
        </div>
        <div className="tw-text-sm tw-text-[var(--text-secondary)] tw-space-y-1 tw-text-right">
          <p>Remaining: <span className="tw-font-medium">{capacityInfo.remaining ?? '—'}</span></p>
          <button type="button" onClick={() => refetch()} className="tw-text-primary hover:tw-text-primary/80 tw-font-medium tw-transition-colors">Refresh</button>
        </div>
      </header>

      {isLoading ? (
        <div className="tw-py-8 tw-flex tw-justify-center">
          <LoadingSpinner label="Loading suggestions..." />
        </div>
      ) : (
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          {suggestions.length === 0 ? (
            <EmptyState title="No suggestions available" description="We don't have any new mentee suggestions for you right now." />
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
    </Card>
  );
};

export default MentorDashboardSuggestions;
