import { apiClient } from '../config/apiClient';

export type SessionStatus = 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
export type AttendanceFilter = 'attended' | 'missed';

export interface AdminReportFilters {
    from?: string;
    to?: string;
    mentorId?: string;
    menteeId?: string;
    topic?: string;
    status?: SessionStatus | SessionStatus[];
    attendance?: AttendanceFilter;
}

export interface AdminReportPerson {
    id: string | null;
    name: string;
    email: string | null;
}

export interface AdminReportSummary {
    totalSessions: number;
    completedSessions: number;
    confirmedSessions: number;
    rescheduledSessions: number;
    cancelledSessions: number;
    pendingSessions: number;
    attendedSessions: number;
    attendanceRate: number;
    averageDurationMinutes: number;
    averageTasksCompleted: number;
    mentorCount: number;
    menteeCount: number;
}

export interface AdminReportStatusBreakdown {
    status: SessionStatus;
    count: number;
    attendanceRate: number;
}

export interface AdminReportMonthlyTrend {
    month: string;
    total: number;
    completed: number;
    attended: number;
}

export interface AdminReportMentorParticipation {
    mentorId: string | null;
    mentor: AdminReportPerson | null;
    totalSessions: number;
    attendanceRate: number;
    completionRate: number;
}

export interface AdminReportSatisfactionGroup {
    averageRating: number;
    count: number;
    distribution: Array<{ rating: number; count: number }>;
}

export interface AdminReportSatisfaction {
    mentee: AdminReportSatisfactionGroup;
    mentor: AdminReportSatisfactionGroup;
}

export interface AdminReportSession {
    id: string;
    subject: string;
    date: string;
    status: SessionStatus;
    attended: boolean;
    durationMinutes: number;
    tasksCompleted: number;
    mentor: AdminReportPerson | null;
    mentee: AdminReportPerson | null;
    menteeRating: number | null;
    mentorRating: number | null;
}

export interface AdminReportFeedbackItem {
    id: string;
    rating: number;
    comment: string | null;
    submittedAt: string;
    mentor: AdminReportPerson | null;
    mentee: AdminReportPerson | null;
    flagged: boolean;
}

export interface AdminReportOverview {
    filters: Record<string, unknown>;
    summary: AdminReportSummary;
    statusBreakdown: AdminReportStatusBreakdown[];
    monthlyTrends: AdminReportMonthlyTrend[];
    mentorParticipation: AdminReportMentorParticipation[];
    satisfaction: AdminReportSatisfaction;
    recentSessions: AdminReportSession[];
    recentFeedback: AdminReportFeedbackItem[];
}

const sanitizeFilters = (filters: AdminReportFilters & { format?: string }) => {
    const params: Record<string, string> = {};

    if (filters.from) {
        params.from = filters.from;
    }
    if (filters.to) {
        params.to = filters.to;
    }
    if (filters.mentorId) {
        params.mentorId = filters.mentorId;
    }
    if (filters.menteeId) {
        params.menteeId = filters.menteeId;
    }
    if (filters.topic) {
        params.topic = filters.topic;
    }
    if (filters.attendance) {
        params.attendance = filters.attendance;
    }

    if (Array.isArray(filters.status) && filters.status.length) {
        params.status = filters.status.join(',');
    } else if (filters.status && !Array.isArray(filters.status)) {
        params.status = filters.status;
    }

    if (filters.format) {
        params.format = filters.format;
    }

    return params;
};

export const fetchAdminReportOverview = async (filters: AdminReportFilters = {}) => {
    const params = sanitizeFilters(filters);
    const { data } = await apiClient.get<{ success: boolean; report: AdminReportOverview }>('/reports/admin/overview', {
        params,
    });
    return data.report;
};

export const downloadAdminReport = async (filters: AdminReportFilters = {}, format: 'csv' | 'pdf') => {
    const params = sanitizeFilters({ ...filters, format });
    // Explicitly attach token to ensure it's not missed for blob requests
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    const response = await apiClient.get<Blob>('/reports/admin/export', {
        params,
        responseType: 'blob',
        headers,
    });
    return response.data;
};
