import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
    fetchMentorFeedbackForSession,
    createMentorFeedback,
    updateMentorFeedback,
    MentorFeedbackRecord,
    fetchProgressSnapshotForMentee,
    MenteeProgressSnapshot,
} from '../services/mentorFeedbackService';
import { mentorSessionsKey } from './useMentorSessions';
import { progressSnapshotKey } from './useGoals';
import { validateRating } from '../utils/feedbackValidator';

const buildSessionMentorFeedbackKey = (sessionId?: string | null) => ['mentor', 'feedback', sessionId];

export type MentorFeedbackSubmissionPayload = {
    sessionId: string;
    rating: number;
    comment?: string | null;
    competencies?: Array<{ skillKey: string; level: number; notes?: string }>;
    visibility?: 'public' | 'private';
};

type SubmissionMode = 'create' | 'update';

export type MentorFeedbackSubmissionVariables = {
    payload: MentorFeedbackSubmissionPayload;
    mode?: SubmissionMode;
};

export const useMentorFeedbackForSession = (sessionId?: string | null, options?: { enabled?: boolean }) => {
    return useQuery<MentorFeedbackRecord | null, AxiosError>({
        queryKey: buildSessionMentorFeedbackKey(sessionId),
        queryFn: () => fetchMentorFeedbackForSession(sessionId as string),
        enabled: Boolean(sessionId) && (options?.enabled ?? true),
        staleTime: 60 * 1000,
    });
};

export const useMentorFeedback = () => {
    const qc = useQueryClient();

    return useMutation<MentorFeedbackRecord, Error, MentorFeedbackSubmissionVariables>({
        mutationFn: async ({ payload, mode = 'create' }) => {
            const ratingValidation = validateRating(payload.rating);
            if (!ratingValidation.valid) {
                throw new Error(ratingValidation.error);
            }

            try {
                if (mode === 'update') {
                    return await updateMentorFeedback(payload);
                }

                return await createMentorFeedback(payload);
            } catch (error: any) {
                if (error?.response?.status === 409) {
                    throw new Error('Feedback already exists for this session.');
                }

                throw new Error(error?.response?.data?.message || error?.message || 'Unable to submit feedback.');
            }
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: mentorSessionsKey });
            qc.invalidateQueries({ queryKey: progressSnapshotKey });
            qc.invalidateQueries({ queryKey: buildSessionMentorFeedbackKey(variables.payload.sessionId) });
        },
    });
};

export const useCreateMentorFeedback = () => {
    const mutation = useMentorFeedback();

    return {
        ...mutation,
        mutate: (payload: MentorFeedbackSubmissionPayload, options?: Parameters<typeof mutation.mutate>[1]) =>
            mutation.mutate({ payload, mode: 'create' }, options),
        mutateAsync: (payload: MentorFeedbackSubmissionPayload) => mutation.mutateAsync({ payload, mode: 'create' }),
    };
};

export const useUpdateMentorFeedback = () => {
    const mutation = useMentorFeedback();

    return {
        ...mutation,
        mutate: (payload: MentorFeedbackSubmissionPayload, options?: Parameters<typeof mutation.mutate>[1]) =>
            mutation.mutate({ payload, mode: 'update' }, options),
        mutateAsync: (payload: MentorFeedbackSubmissionPayload) => mutation.mutateAsync({ payload, mode: 'update' }),
    };
};

// Hook: fetch progress snapshot for a first-class mentee id (mentor / admin views)
const buildMenteeProgressKey = (menteeId?: string | null) => ['progressSnapshot', 'mentee', menteeId];

export const useMenteeProgressSnapshot = (menteeId?: string | null, options?: { enabled?: boolean }) => {
    return useQuery<MenteeProgressSnapshot | null>({
        queryKey: buildMenteeProgressKey(menteeId),
        queryFn: () => fetchProgressSnapshotForMentee(menteeId as string),
        enabled: Boolean(menteeId) && (options?.enabled ?? true),
        staleTime: 60 * 1000,
    });
};

export default useMentorFeedbackForSession;
