import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../config/apiClient';
import { CHAT_THREADS_QUERY_KEY, ChatThread, ListThreadsResponse } from '../services/chatService';
import logger from '../utils/logger';

interface MarkThreadReadResponse {
  thread?: ChatThread;
}

const setThreadUnreadCountToZero = (threads: ChatThread[], threadId: string) => {
  return threads.map((thread) => {
    if (thread.id !== threadId || thread.unreadCount === 0) {
      return thread;
    }
    return {
      ...thread,
      unreadCount: 0,
    };
  });
};

export const useMarkThreadAsRead = (threadId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ChatThread | null, AxiosError, string | undefined>({
    mutationFn: async (overrideThreadId) => {
      const targetThreadId = overrideThreadId ?? threadId;
      if (!targetThreadId) {
        return null;
      }

      const { data } = await apiClient.post<MarkThreadReadResponse>(`/chat/threads/${targetThreadId}/read`);
      return data?.thread ?? null;
    },
    onMutate: async (overrideThreadId) => {
      const targetThreadId = overrideThreadId ?? threadId;
      if (!targetThreadId) {
        return;
      }

      queryClient.setQueryData<ListThreadsResponse | undefined>(CHAT_THREADS_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          threads: setThreadUnreadCountToZero(current.threads, targetThreadId),
        };
      });
    },
    onSuccess: (updatedThread, overrideThreadId) => {
      const targetThreadId = overrideThreadId ?? threadId;

      if (updatedThread?.id) {
        queryClient.setQueryData<ListThreadsResponse | undefined>(CHAT_THREADS_QUERY_KEY, (current) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            threads: current.threads.map((thread) => (thread.id === updatedThread.id ? updatedThread : thread)),
          };
        });
      } else if (targetThreadId) {
        queryClient.setQueryData<ListThreadsResponse | undefined>(CHAT_THREADS_QUERY_KEY, (current) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            threads: setThreadUnreadCountToZero(current.threads, targetThreadId),
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
    },
    onError: (error, overrideThreadId) => {
      const targetThreadId = overrideThreadId ?? threadId;
      logger.error('Failed to mark thread as read', {
        threadId: targetThreadId,
        error,
      });
    },
  });

  return {
    ...mutation,
    markThreadAsRead: (overrideThreadId?: string) => {
      mutation.mutate(overrideThreadId);
    },
  };
};
