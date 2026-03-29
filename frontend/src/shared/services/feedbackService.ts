import { apiClient } from '../config/apiClient';

export interface PendingFeedbackSession {
    id: string;
    subject: string;
    mentor: {
        id: string | null;
        name: string;
    };
    date: string;
    feedbackWindowClosesAt?: string | null;
}

export interface SessionFeedbackPayload {
    sessionId: string;
    rating: number;
    text?: string;
    flagReason?: string;
    recaptchaToken?: string;
}

export interface SessionFeedbackRecord {
    id: string;
    sessionId: string;
    mentorId: string;
    rating: number;
    text: string;
    flagged: boolean;
    flagReason: string | null;
    anonymizedCode?: string | null;
    windowClosesAt?: string | null;
    submittedAt: string;
    updatedAt?: string;
}

export interface FlagSessionFeedbackPayload {
    feedbackId: string;
    reason: string;
}

export interface MentorFeedbackSummary {
    ratingAvg: number;
    ratingCount: number;
}

export const fetchPendingFeedbackSessions = async () => {
    const { data } = await apiClient.get<{ pending: PendingFeedbackSession[] }>('/feedback/pending');
    return data.pending || [];
};

export const fetchSessionFeedback = async (sessionId: string) => {
    const { data } = await apiClient.get<{ feedback: SessionFeedbackRecord | null }>(`/sessions/${sessionId}/feedback`);
    return data.feedback;
};

export const createSessionFeedback = async ({ sessionId, ...payload }: SessionFeedbackPayload) => {
    const { data } = await apiClient.post<{ data: SessionFeedbackRecord }>(`/sessions/${sessionId}/feedback`, payload);
    return data.data;
};

export const updateSessionFeedback = async ({ sessionId, ...payload }: SessionFeedbackPayload) => {
    const { data } = await apiClient.put<{ data: SessionFeedbackRecord }>(`/sessions/${sessionId}/feedback`, payload);
    return data.data;
};

export const fetchMentorFeedbackSummary = async (mentorId: string) => {
    const { data } = await apiClient.get<{ summary: MentorFeedbackSummary }>(`/mentors/${mentorId}/feedback-summary`);
    return data.summary;
};

export const flagSessionFeedback = async ({ feedbackId, reason }: FlagSessionFeedbackPayload) => {
    const { data } = await apiClient.post<{ success: boolean }>(`/feedback/${feedbackId}/flag`, { reason });
    return data;
};
