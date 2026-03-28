import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptMentorshipRequest,
  declineMentorshipRequest,
  fetchMentorshipRequests,
  MentorshipRequest,
  MentorshipRequestsResponse,
  withdrawMentorshipRequest,
} from '../../../shared/services/mentorMatching';

export type MentorshipRequestScope = 'mentee' | 'mentor';

const REQUESTS_QUERY_KEY = ['mentorship-requests'];

export type MentorshipRequestsHook = {
  requests: MentorshipRequest[];
  meta: MentorshipRequestsResponse['meta'];
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => Promise<void>;
  acceptRequest: (id: string, sessionSuggestion?: string) => Promise<unknown>;
  declineRequest: (id: string, declineReason?: string) => Promise<unknown>;
  withdrawRequest: (id: string) => Promise<unknown>;
  isMutating: boolean;
  mutatingId?: string;
};

export const useMentorshipRequests = (scope: MentorshipRequestScope): MentorshipRequestsHook => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...REQUESTS_QUERY_KEY, scope],
    queryFn: () => fetchMentorshipRequests(scope),
    refetchInterval: 30 * 1000,
  });

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const acceptMutation = useMutation({
    mutationFn: ({ id, sessionSuggestion }: { id: string; sessionSuggestion?: string }) =>
      acceptMentorshipRequest(id, sessionSuggestion),
    onSuccess: invalidateAll,
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, declineReason }: { id: string; declineReason?: string }) =>
      declineMentorshipRequest(id, declineReason),
    onSuccess: invalidateAll,
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => withdrawMentorshipRequest(id),
    onSuccess: invalidateAll,
  });

  const acceptRequest = useCallback(
    async (id: string, sessionSuggestion?: string) => {
      const result = await acceptMutation.mutateAsync({ id, sessionSuggestion });
      return result;
    },
    [acceptMutation]
  );

  const declineRequest = useCallback(
    async (id: string, declineReason?: string) => {
      const result = await declineMutation.mutateAsync({ id, declineReason });
      return result;
    },
    [declineMutation]
  );

  const withdrawRequest = useCallback(
    async (id: string) => {
      const result = await withdrawMutation.mutateAsync(id);
      return result;
    },
    [withdrawMutation]
  );

  return {
    requests: query.data?.requests ?? [],
    meta: query.data?.meta ?? { scope, total: 0, pending: 0 },
    isLoading: query.isLoading,
    isRefetching: query.isFetching,
    refetch: async () => {
      await query.refetch();
    },
    acceptRequest,
    declineRequest,
    withdrawRequest,
    isMutating: acceptMutation.isPending || declineMutation.isPending || withdrawMutation.isPending,
    mutatingId: (acceptMutation.variables?.id || declineMutation.variables?.id || withdrawMutation.variables) as string | undefined,
  };
};

export default useMentorshipRequests;
