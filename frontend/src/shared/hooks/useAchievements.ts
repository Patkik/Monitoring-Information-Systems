import { useQuery } from '@tanstack/react-query';
import { fetchAchievements, Achievement } from '../services/achievementService';

export const achievementsQueryKey = ['achievements'];

/**
 * Hook to fetch and manage user achievements state
 * Uses TanStack Query for caching and state management
 * @returns Query result with achievements array, loading/error states
 */
export function useAchievements() {
  return useQuery<Achievement[]>(
    achievementsQueryKey,
    fetchAchievements,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
      retry: 1,
    }
  );
}
