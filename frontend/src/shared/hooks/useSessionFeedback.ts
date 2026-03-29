import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
    createSessionFeedback,
    fetchMentorFeedbackSummary,
    fetchPendingFeedbackSessions,
    fetchSessionFeedback,
    flagSessionFeedback,
    FlagSessionFeedbackPayload,
    MentorFeedbackSummary,
    PendingFeedbackSession,
    SessionFeedbackPayload,
    SessionFeedbackRecord,
    updateSessionFeedback,
} from '../services/feedbackService';
import { menteeSessionsKey } from './useMenteeSessions';

const pendingFeedbackKey = ['feedback', 'pending'];
const buildSessionFeedbackKey = (sessionId?: string | null) => ['feedback', 'session', sessionId];

export const usePendingFeedbackSessions = () => {
    return useQuery<PendingFeedbackSession[], AxiosError>({
        queryKey: pendingFeedbackKey,
        queryFn: fetchPendingFeedbackSessions,
        staleTime: 5 * 60 * 1000,
    });
};

export const useSubmitSessionFeedback = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ mode = 'create', ...payload }: SessionFeedbackPayload & { mode?: 'create' | 'update' }) =>
            mode === 'update' ? updateSessionFeedback(payload) : createSessionFeedback(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: pendingFeedbackKey });
            queryClient.invalidateQueries({ queryKey: menteeSessionsKey });
            queryClient.invalidateQueries({ queryKey: buildSessionFeedbackKey(variables.sessionId) });
        },
    });
};

export const useMentorFeedbackSummary = (mentorId?: string | null) => {
    return useQuery<MentorFeedbackSummary, AxiosError>({
        queryKey: ['feedback', 'summary', mentorId],
        queryFn: () => fetchMentorFeedbackSummary(mentorId as string),
        enabled: Boolean(mentorId),
        staleTime: 5 * 60 * 1000,
    });
};

export const useSessionFeedback = (sessionId?: string | null, options?: { enabled?: boolean }) => {
    return useQuery<SessionFeedbackRecord | null, AxiosError>({
        queryKey: buildSessionFeedbackKey(sessionId),
        queryFn: () => fetchSessionFeedback(sessionId as string),
        enabled: Boolean(sessionId) && (options?.enabled ?? true),
        staleTime: 60 * 1000,
    });
};

export const useFlagSessionFeedback = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: FlagSessionFeedbackPayload) => flagSessionFeedback(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: pendingFeedbackKey });
            queryClient.invalidateQueries({ queryKey: menteeSessionsKey });
        },
    });
};
