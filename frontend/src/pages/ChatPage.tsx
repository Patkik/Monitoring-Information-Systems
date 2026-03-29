import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import ChatThreadList from '../components/chat/ChatThreadList';
import ChatWindow from '../components/chat/ChatWindow';
import { useMarkThreadAsRead } from '../shared/hooks/useChatThread';
import { useChatThreads } from '../shared/hooks/useChatThreads';
import { useChatMessages } from '../shared/hooks/useChatMessages';
import {
  CHAT_THREADS_QUERY_KEY,
  chatMessagesQueryKey,
  sendMessage,
  archiveThread as archiveThreadRequest,
  unarchiveThread as unarchiveThreadRequest,
  deleteThread as deleteThreadRequest,
  type ChatMessage,
} from '../shared/services/chatService';

interface ApiError {
  message?: string;
  error?: string;
}

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const ChatPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { threads, isLoading, error, startConversation } = useChatThreads();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [threadActionError, setThreadActionError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const lastMarkedThreadIdRef = useRef<string | null>(null);

  const user = useMemo(() => readStoredUser(), []);
  const currentUserId: string | null = user?._id || user?.id || null;
  const isMentor = (user?.role || '').toLowerCase() === 'mentor';

  const threadsMatchingView = useMemo(() => {
    return threads.filter((thread) => (showArchived ? thread.archived : !thread.archived));
  }, [threads, showArchived]);
  const hasVisibleThreads = threadsMatchingView.length > 0;

  const searchParamsString = searchParams.toString();
  useEffect(() => {
    const requestedThreadId = searchParams.get('threadId');
    if (requestedThreadId && threads.some((thread) => thread.id === requestedThreadId)) {
      setActiveThreadId(requestedThreadId);
      const nextParams = new URLSearchParams(searchParamsString);
      nextParams.delete('threadId');
      setSearchParams(nextParams, { replace: true });
      return;
    }

    if (!activeThreadId) {
      const fallback = threadsMatchingView[0] ?? threads[0];
      if (fallback) {
        setActiveThreadId(fallback.id);
      }
      return;
    }

    const activeThread = threads.find((thread) => thread.id === activeThreadId);
    if (!activeThread) {
      const fallback = threadsMatchingView[0] ?? threads[0] ?? null;
      setActiveThreadId(fallback?.id ?? null);
      return;
    }

    if (!showArchived && activeThread.archived) {
      const fallback = threadsMatchingView[0] ?? null;
      if (fallback?.id !== activeThreadId) {
        setActiveThreadId(fallback?.id ?? null);
      }
    }
  }, [threads, threadsMatchingView, activeThreadId, searchParams, searchParamsString, setSearchParams, showArchived]);

  const activeThread = useMemo(() => {
    if (!activeThreadId) return null;
    return threads.find((thread) => thread.id === activeThreadId) ?? null;
  }, [threads, activeThreadId]);

  const { markThreadAsRead } = useMarkThreadAsRead(activeThreadId ?? '');

  const triggerMarkThreadAsRead = useCallback((threadId: string) => {
    if (!threadId) {
      return;
    }
    lastMarkedThreadIdRef.current = threadId;
    // Fire-and-forget side effect to avoid blocking thread open interactions.
    markThreadAsRead(threadId);
  }, [markThreadAsRead]);

  const handleSelectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  const messagesQuery = useChatMessages(activeThreadId);

  const focusNewChatInput = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const input = document.getElementById('new-chat-email') as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleToggleArchived = (value: boolean) => {
    setShowArchived(value);
    setActiveThreadId((currentId) => {
      const currentThread = currentId ? threads.find((thread) => thread.id === currentId) ?? null : null;

      if (!value) {
        if (currentThread?.archived) {
          const nextThread = threads.find((thread) => !thread.archived) ?? null;
          return nextThread?.id ?? null;
        }
        return currentId;
      }

      if (!currentThread) {
        const nextThread = threads.find((thread) => thread.archived) ?? threads[0] ?? null;
        return nextThread?.id ?? null;
      }

      return currentId;
    });
  };

  const messages = useMemo(() => {
    if (!messagesQuery.data) {
      return [];
    }
    return messagesQuery.data.pages.flatMap((page) => page.messages);
  }, [messagesQuery.data]);

  useEffect(() => {
    if (!activeThreadId) {
      return;
    }

    if (lastMarkedThreadIdRef.current === activeThreadId) {
      return;
    }

    triggerMarkThreadAsRead(activeThreadId);
  }, [activeThreadId, triggerMarkThreadAsRead]);

  const sendMessageMutation = useMutation<ChatMessage, AxiosError<ApiError>, { threadId: string; body: string }>({
    mutationFn: ({ threadId, body }) => sendMessage(threadId, body),
    onMutate: () => {
      setSendError(null);
    },
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: chatMessagesQueryKey(message.threadId) });
      queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
    },
    onError: (err: AxiosError<ApiError>, variables) => {
      const customMessage = err.response?.data?.message ?? 'Failed to send message.';
      setSendError(customMessage);
      if (err.response?.status === 404) {
        setActiveThreadId((current) => (current === variables.threadId ? null : current));
        queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
      }
    },
  });

  const handleSendMessage = async (body: string) => {
    if (!activeThreadId) {
      setSendError('Select a conversation first.');
      return;
    }
    await sendMessageMutation.mutateAsync({ threadId: activeThreadId, body });
  };

  const handleStartConversation = async (email: string) => {
    try {
      setCreationError(null);
      const thread = await startConversation.mutateAsync({ participantEmail: email });
      if (thread?.id) {
        setActiveThreadId(thread.id);
        queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      const message = axiosError.response?.data?.message ?? 'Unable to start conversation.';
      setCreationError(message);
      throw err;
    }
  };

  const archiveThreadMutation = useMutation<void, AxiosError<ApiError>, string>({
    mutationFn: (threadId) => archiveThreadRequest(threadId),
    onMutate: () => setThreadActionError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
    },
    onError: (err) => {
      const message = err.response?.data?.message ?? 'Unable to archive chat.';
      setThreadActionError(message);
    },
  });

  const unarchiveThreadMutation = useMutation<void, AxiosError<ApiError>, string>({
    mutationFn: (threadId) => unarchiveThreadRequest(threadId),
    onMutate: () => setThreadActionError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
    },
    onError: (err) => {
      const message = err.response?.data?.message ?? 'Unable to unarchive chat.';
      setThreadActionError(message);
    },
  });

  const deleteThreadMutation = useMutation<void, AxiosError<ApiError>, string>({
    mutationFn: (threadId) => deleteThreadRequest(threadId),
    onMutate: () => setThreadActionError(null),
    onSuccess: (_, threadId) => {
      setActiveThreadId((current) => (current === threadId ? null : current));
      queryClient.invalidateQueries({ queryKey: CHAT_THREADS_QUERY_KEY });
    },
    onError: (err) => {
      const message = err.response?.data?.message ?? 'Unable to delete chat.';
      setThreadActionError(message);
    },
  });

  const handleArchiveThread = (threadId: string) => {
    archiveThreadMutation.mutate(threadId);
  };

  const handleUnarchiveThread = (threadId: string) => {
    unarchiveThreadMutation.mutate(threadId);
  };

  const handleDeleteThread = (threadId: string) => {
    const confirmed = window.confirm('Delete this conversation? This removes all messages for both sides.');
    if (!confirmed) {
      return;
    }
    deleteThreadMutation.mutate(threadId);
  };

  const isThreadActionPending =
    archiveThreadMutation.isLoading || unarchiveThreadMutation.isLoading || deleteThreadMutation.isLoading;

  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-flex tw-flex-col lg:tw-flex-row tw-gap-6 tw-min-h-[70vh]">
        <ChatThreadList
          threads={threads}
          activeThreadId={activeThreadId}
          onSelect={handleSelectThread}
          onThreadRead={triggerMarkThreadAsRead}
          onStartConversation={handleStartConversation}
          isCreating={startConversation.isLoading}
          errorMessage={creationError}
          isLoading={isLoading}
          canManage={isMentor}
          showArchived={showArchived}
          onToggleArchived={handleToggleArchived}
          onArchiveThread={handleArchiveThread}
          onUnarchiveThread={handleUnarchiveThread}
          onDeleteThread={handleDeleteThread}
          actionDisabled={isThreadActionPending}
          actionErrorMessage={threadActionError}
        />

        <div className="tw-flex-1 tw-min-h-[400px] tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-200 tw-flex tw-flex-col">
          {error ? (
            <div className="tw-flex tw-items-center tw-justify-center tw-flex-1 tw-text-red-600 tw-text-sm tw-p-6">
              Failed to load conversations.
            </div>
          ) : null}

          {!activeThread ? (
            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-flex-1 tw-text-center tw-gap-4 tw-p-6">
              <div>
                <p className="tw-text-base tw-font-semibold tw-text-gray-900">
                  {hasVisibleThreads ? 'Pick a conversation to get started' : 'No chats in this view yet'}
                </p>
                <p className="tw-mt-1 tw-text-sm tw-text-gray-500">
                  {hasVisibleThreads
                    ? 'Select a conversation on the left or invite someone new.'
                    : showArchived
                      ? 'You have no archived conversations. Start a new chat to reach out.'
                      : 'Start a conversation to connect with mentors or mentees.'}
                </p>
              </div>
              <button
                type="button"
                onClick={focusNewChatInput}
                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-blue-600 tw-text-white tw-px-5 tw-py-2.5 tw-text-sm tw-font-medium hover:tw-bg-blue-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            <ChatWindow
              counterpart={activeThread.counterpart}
              threadTitle={activeThread.title}
              participants={activeThread.participants}
              session={activeThread.session}
              messages={messages}
              isLoading={messagesQuery.isLoading && !messagesQuery.isFetchingNextPage}
              onSend={handleSendMessage}
              isSending={sendMessageMutation.isLoading}
              hasMore={Boolean(messagesQuery.hasNextPage)}
              onLoadMore={async () => {
                await messagesQuery.fetchNextPage();
              }}
              currentUserId={currentUserId}
              error={sendError}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
