import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchMenteeProgress, MenteeProgressData } from '../services/mentorService';

export const menteeProgressKey = (menteeId: string) => ['mentee', menteeId, 'progress'];

export const useMenteeProgress = (menteeId: string): UseQueryResult<MenteeProgressData, Error> =>
    useQuery<MenteeProgressData, Error>(
        menteeProgressKey(menteeId),
        () => fetchMenteeProgress(menteeId),
        {
            staleTime: 5 * 60_000, // 5 minutes
            cacheTime: 10 * 60_000, // 10 minutes
            enabled: !!menteeId, // only fetch if menteeId is provided
            retry: 1,
        }
    );
