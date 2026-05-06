import type { AxiosResponse } from 'axios';
import { apiClient } from '../config/apiClient';

export type SessionStatus =
    | 'pending'
    | 'confirmed'
    | 'rescheduled'
    | 'cancelled'
    | 'completed'
    | 'overdue'
    | 'upcoming';

export interface SessionParticipant {
    id: string | null;
    name: string;
    email?: string;
    status?: string;
    avatar?: string | null;
}

export interface CalendarEvent {
    provider: 'google';
    externalId?: string | null;
    calendarId?: string | null;
    htmlLink?: string | null;
    hangoutLink?: string | null;
    status?: string | null;
    updatedAt?: string | null;
    lastSyncedAt?: string | null;
}

export interface SessionRecord {
    id: string;
    subject: string;
    mentor: SessionParticipant | null;
    mentee?: SessionParticipant | null;
    participants?: SessionParticipant[];
    participantCount?: number;
    room?: string | null;
    capacity?: number | null;
    isGroup?: boolean;
    chatThreadId?: string | null;
    date: string;
    durationMinutes: number;
    attended: boolean;
    tasksCompleted: number;
    notes: string | null;
    status?: SessionStatus;
    completedAt?: string | null;
    feedbackDue?: boolean;
    feedbackSubmitted?: boolean;
    feedbackWindowClosesAt?: string | null;
    calendarEvent?: CalendarEvent | null;
}


export type MenteeSession = SessionRecord;
export type MentorSession = SessionRecord;

export interface SessionsResponse {
    success: boolean;
    sessions: SessionRecord[];
    meta?: {
        cursor?: string | null;
        hasMore?: boolean;
        page?: number;
    };
}

const extractWarnings = (meta?: { warnings?: ApiWarning[] }): ApiWarning[] | undefined => {
    if (!meta?.warnings || meta.warnings.length === 0) {
        return undefined;
    }
    return meta.warnings;
};

export interface ApiWarning {
    code: string;
    message: string;
}

export interface CompleteSessionPayload {
    attended?: boolean;
    tasksCompleted?: number;
    notes?: string | null;
}

export interface CreateMentorSessionPayload {
    subject: string;
    date: string; // ISO string
    durationMinutes: number;
    room: string;
    capacity: number;
    participantIds: string[];
}

export interface CreateMentorSessionResult {
    session: SessionRecord;
    warnings?: ApiWarning[];
}

export interface SessionResponse {
    session: SessionRecord;
    warnings?: ApiWarning[];
}

export interface BookSessionPayload {
    mentorId: string;
    subject: string;
    scheduledAt: string;
    durationMinutes?: number;
    room?: string;
    availabilityRef?: string;
    lockId?: string;
}

export interface BookingLockPayload {
    mentorId: string;
    scheduledAt: string;
    durationMinutes?: number;
    availabilityRef?: string;
}

export interface BookingLockResult {
    lockId: string;
    expiresAt: string;
}

export interface RescheduleSessionPayload {
    scheduledAt: string;
    durationMinutes?: number;
    availabilityRef?: string;
}

export interface CancelSessionPayload {
    reason?: string;
    notify?: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceEntryPayload {
    userId: string;
    status: AttendanceStatus;
    note?: string;
}

export interface AttendancePayload {
    attendance: AttendanceEntryPayload[];
}

export const fetchMenteeSessions = async (): Promise<MenteeSession[]> => {
    const { data } = await apiClient.get<SessionsResponse>('/sessions');
    return data.sessions || [];
};

export const fetchMentorSessions = async (): Promise<MentorSession[]> => {
    const { data } = await apiClient.get<SessionsResponse>('/mentor/sessions');
    return data.sessions || [];
};

export const completeSession = async (
    sessionId: string,
    payload: CompleteSessionPayload = {}
): Promise<SessionRecord> => {
    const { data } = await apiClient.patch<{ success: boolean; session: SessionRecord }>(
        `/sessions/${sessionId}/complete`,
        payload
    );

    return data.session;
};

export const createMentorSession = async (payload: CreateMentorSessionPayload): Promise<CreateMentorSessionResult> => {
    const { data } = await apiClient.post<{
        success: boolean;
        session: SessionRecord;
        meta?: { warnings?: ApiWarning[] };
    }>('/mentor/sessions', payload);

    const warnings = extractWarnings(data.meta);
    return { session: data.session, warnings };
};

export const bookSession = async (payload: BookSessionPayload): Promise<SessionResponse> => {
    const { data } = await apiClient.post<{
        success: boolean;
        session: SessionRecord;
        meta?: { warnings?: ApiWarning[] };
    }>('/sessions', payload);

    return {
        session: data.session,
        warnings: extractWarnings(data.meta),
    };
};

export const createBookingLock = async (payload: BookingLockPayload): Promise<BookingLockResult> => {
    const { data } = await apiClient.post<{ success: boolean; lockId: string; expiresAt: string }>(
        '/sessions/lock',
        payload
    );

    return {
        lockId: data.lockId,
        expiresAt: data.expiresAt,
    };
};

export const getSessionDetail = async (sessionId: string): Promise<SessionResponse> => {
    const { data } = await apiClient.get<{
        success: boolean;
        session: SessionRecord;
        meta?: { warnings?: ApiWarning[] };
    }>(`/sessions/${sessionId}`);

    return {
        session: data.session,
        warnings: extractWarnings(data.meta),
    };
};

export const confirmSession = async (sessionId: string): Promise<SessionResponse> => {
    const { data } = await apiClient.patch<{
        success: boolean;
        session: SessionRecord;
        meta?: { warnings?: ApiWarning[] };
    }>(`/sessions/${sessionId}/confirm`, {});

    return {
        session: data.session,
        warnings: extractWarnings(data.meta),
    };
};

export const rescheduleSession = async (
    sessionId: string,
    payload: RescheduleSessionPayload
): Promise<SessionResponse> => {
    const { data } = await apiClient.patch<{
        success: boolean;
        session: SessionRecord;
        meta?: { warnings?: ApiWarning[] };
    }>(`/sessions/${sessionId}/reschedule`, payload);

    return {
        session: data.session,
        warnings: extractWarnings(data.meta),
    };
};

export const cancelSession = async (
    sessionId: string,
    payload: CancelSessionPayload = {}
): Promise<SessionResponse> => {
    const { data } = await apiClient.patch<{
        success: boolean;
        session: SessionRecord;
        meta?: { warnings?: ApiWarning[] };
    }>(`/sessions/${sessionId}/cancel`, payload);

    return {
        session: data.session,
        warnings: extractWarnings(data.meta),
    };
};

export const recordAttendance = async (
    sessionId: string,
    payload: AttendancePayload
): Promise<SessionResponse> => {
    const { data } = await apiClient.post<{
        success: boolean;
        session: SessionRecord;
        meta?: { warnings?: ApiWarning[] };
    }>(`/sessions/${sessionId}/attendance`, payload);

    return {
        session: data.session,
        warnings: extractWarnings(data.meta),
    };
};

export const exportMenteeSessionsReport = async (
    format: 'csv' | 'pdf' = 'csv'
): Promise<AxiosResponse<Blob>> =>
    apiClient.get('/sessions/export', {
        params: { format },
        responseType: 'blob',
    });
