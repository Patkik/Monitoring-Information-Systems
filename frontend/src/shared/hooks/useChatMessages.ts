import { useEffect } from 'react';
import { InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  CHAT_THREADS_QUERY_KEY,
  ChatMessage,
  ListMessagesResponse,
  chatMessagesQueryKey,
  listMessages,
} from '../services/chatService';
import { getPusherClient } from '../config/pusherClient';

const EMPTY_MESSAGES = { messages: [], cursor: null, limit: 50 } satisfies ListMessagesResponse;

export const useChatMessages = (threadId: string | null) => {
  const queryClient = useQueryClient();
  const enabled = Boolean(threadId);

  const query = useInfiniteQuery<ListMessagesResponse, AxiosError>({
    queryKey: threadId ? chatMessagesQueryKey(threadId) : ['chat', 'threads', 'unknown', 'messages'],
    queryFn: ({ pageParam }) => {
      if (!threadId) {
        return Promise.resolve(EMPTY_MESSAGES);
      }
      const params = pageParam ? { cursor: pageParam as string } : {};
      return listMessages(threadId, params);
    },
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    enabled,
    // Refetch when user returns to the tab (fallback for Pusher)
    refetchOnWindowFocus: true,
    // Poll for new messages every 5 seconds as fallback if Pusher doesn't work
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!threadId) {
      return;
    }
    const pusher = getPusherClient();
    if (!pusher) {
      return;
    }

    const channelName = `private-thread-${threadId}`;
    const channel = pusher.subscribe(channelName);

    const messageKey = chatMessagesQueryKey(threadId);

    const handleNewMessage = (event: ChatMessage) => {
      queryClient.setQueryData<InfiniteData<ListMessagesResponse> | undefined>(messageKey, (current) => {
        if (!current) {
          return current;
        }

        const alreadyExists = current.pages.some((page) =>
          page.messages.some((message) => message.id === event.id)
        );
        if (alreadyExists) {
          return current;
        }

        const nextPages = current.pages.map((page, index) => {
          if (index !== 0) {
            return page;
          }
          return {
            ...page,
            messages: [...page.messages, event],
          };
        });

        return {
          pageParams: current.pageParams,
          pages: nextPages,
        };
      });

      queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
    };

    const handleThreadUpdated = () => {
      queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
    };

    const handleThreadRead = () => {
      queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
    };

    channel.bind('message:new', handleNewMessage);
    channel.bind('thread:updated', handleThreadUpdated);
    channel.bind('thread:read', handleThreadRead);

    return () => {
      channel.unbind('message:new', handleNewMessage);
      channel.unbind('thread:updated', handleThreadUpdated);
      channel.unbind('thread:read', handleThreadRead);
      pusher.unsubscribe(channelName);
    };
  }, [threadId, queryClient]);

  return query;
};
