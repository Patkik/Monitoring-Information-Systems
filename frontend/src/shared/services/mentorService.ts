import { apiClient } from '../config/apiClient';

export interface MentorRosterEntry {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    status?: 'active' | 'inactive' | 'paused';
    progress?: number; // 0-100
}

interface MentorRosterResponse {
    success: boolean;
    mentees: MentorRosterEntry[];
}

export interface SessionTrendPoint {
    week: string;
    sessions: number;
    attended: number;
    tasksCompleted: number;
}

export interface Competency {
    skillKey: string;
    level: number;
    label?: string;
    notes?: string;
}

export interface MenteeGoal {
    id: string;
    title: string;
    status: 'active' | 'completed' | 'paused' | 'archived';
    progressPercent: number;
}

export interface MenteeProgressData {
    menteeId: string;
    averageProgress: number;
    totalMilestones: number;
    milestonesAchieved: number;
    sessionsTrend: SessionTrendPoint[];
    goals: MenteeGoal[];
    competencies: Competency[];
}

export const fetchMentorRoster = async (): Promise<MentorRosterEntry[]> => {
    const { data } = await apiClient.get<MentorRosterResponse>('/mentor/mentees');
    return data.mentees || [];
};

export const fetchMenteeProgress = async (menteeId: string): Promise<MenteeProgressData> => {
    try {
        // Try the mentee-specific endpoint first
        const { data } = await apiClient.get<MenteeProgressData>(`/mentees/${menteeId}/progress`);
        return data;
    } catch (error: any) {
        // If 403 Forbidden, re-throw to show authorization error
        if (error?.response?.status === 403) {
            throw new Error('You do not have access to view this mentee\'s progress');
        }
        // Otherwise, fallback to dashboard endpoint if available
        throw error;
    }
};
