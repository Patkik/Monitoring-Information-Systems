import { apiClient } from '../config/apiClient';

export interface ProgressData {
  current: number;
  target: number;
  unit?: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string; // emoji or image URL
  status: 'locked' | 'in_progress' | 'unlocked';
  progress?: ProgressData;
  earnedAt?: string; // ISO date string
  color?: string; // hex or tailwind color code
  rewardPoints?: number;
}

export interface AchievementsResponse {
  success: boolean;
  achievements: Achievement[];
}

/**
 * Fetch the current user's achievements
 * @returns Promise resolving to array of achievements
 */
export const fetchAchievements = async (): Promise<Achievement[]> => {
  try {
    const { data } = await apiClient.get<AchievementsResponse>('/achievements');
    return data.achievements || [];
  } catch (error: any) {
    if (error?.response?.status === 403) {
      throw new Error('You do not have permission to view achievements');
    }
    throw error;
  }
};
