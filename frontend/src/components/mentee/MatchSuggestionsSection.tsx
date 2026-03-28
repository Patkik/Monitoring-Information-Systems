import React, { useMemo, useState } from 'react';
import { useMenteeMatchSuggestions, useMenteeAcceptMatch, useMenteeDeclineMatch } from '../../features/matchmaking/hooks/useMatchSuggestions';
import MenteeSuggestionCard from '../../features/matchmaking/components/MenteeSuggestionCard';

interface MatchSuggestionsSectionProps {
  limit?: number;
  showHeader?: boolean;
}

const MatchSuggestionsSection: React.FC<MatchSuggestionsSectionProps> = ({ limit = 5, showHeader = true }) => {
  const storedUser = useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const menteeId = storedUser?._id || storedUser?.id || storedUser?.user?._id;
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  const { data, isLoading, refetch } = useMenteeMatchSuggestions(menteeId, limit);
  const acceptMutation = useMenteeAcceptMatch(menteeId, limit);
  const declineMutation = useMenteeDeclineMatch(menteeId, limit);

  if (!menteeId) {
    return null;
  }

  const suggestions = data?.suggestions ?? [];

  const handleAccept = (matchId: string) => {
    acceptMutation.mutate(
      { matchId },
      {
        onSuccess: (result: any) => {
          setToast({ message: result?.mentorship ? 'Match confirmed! Mentorship established.' : 'Accepted! Waiting for mentor confirmation.', variant: 'success' });
          setTimeout(() => setToast(null), 3000);
        },
        onError: (error: unknown) => {
          setToast({ message: (error as Error)?.message || 'Unable to accept match.', variant: 'error' });
          setTimeout(() => setToast(null), 3000);
        },
      }
    );
  };

  const handleDecline = (matchId: string) => {
    declineMutation.mutate(
      { matchId },
      {
        onSuccess: () => {
          setToast({ message: 'Declined suggestion', variant: 'info' });
          setTimeout(() => setToast(null), 3000);
        },
        onError: (error: unknown) => {
          setToast({ message: (error as Error)?.message || 'Unable to decline match.', variant: 'error' });
          setTimeout(() => setToast(null), 3000);
        },
      }
    );
  };

  if (!suggestions.length && !isLoading) {
    return null;
  }

  return (
    <section className="tw-space-y-4 tw-mb-8">
      {showHeader && (
        <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-4">
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Mentor suggestions for you</h2>
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">We've matched these mentors based on your profile and goals.</p>
          </div>
          <button
            type="button"
            className="tw-text-sm tw-text-purple-600 tw-font-semibold hover:tw-text-purple-700"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
          <span className="tw-animate-spin tw-h-5 tw-w-5 tw-border-b-2 tw-border-purple-500 tw-rounded-full" />
          <span className="tw-ml-2 tw-text-sm tw-text-gray-600">Loading suggestions…</span>
        </div>
      ) : (
        <div className="tw-grid tw-grid-cols-1 tw-gap-4">
          {suggestions.map((suggestion) => (
            <MenteeSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={() => handleAccept(suggestion.id)}
              onDecline={() => handleDecline(suggestion.id)}
              isAccepting={acceptMutation.isPending && acceptMutation.variables?.matchId === suggestion.id}
              isDeclining={declineMutation.isPending && declineMutation.variables?.matchId === suggestion.id}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className={`tw-p-4 tw-rounded-lg tw-mb-4 ${toast.variant === 'success' ? 'tw-bg-green-50 tw-text-green-800' : toast.variant === 'error' ? 'tw-bg-red-50 tw-text-red-800' : 'tw-bg-blue-50 tw-text-blue-800'}`}>
          {toast.message}
        </div>
      )}
    </section>
  );
};

export default MatchSuggestionsSection;
