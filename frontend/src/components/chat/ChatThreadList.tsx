import React, { useMemo, useState } from 'react';
import type { ChatThread } from '../../shared/services/chatService';

interface ChatThreadListProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelect: (threadId: string) => void;
  onThreadRead?: (threadId: string) => void;
  onStartConversation: (email: string) => Promise<void>;
  isCreating: boolean;
  errorMessage?: string | null;
  isLoading?: boolean;
  canManage?: boolean;
  showArchived?: boolean;
  onToggleArchived?: (value: boolean) => void;
  onArchiveThread?: (threadId: string) => void;
  onUnarchiveThread?: (threadId: string) => void;
  onDeleteThread?: (threadId: string) => void;
  actionDisabled?: boolean;
  actionErrorMessage?: string | null;
}

const formatTimestamp = (input: string | Date | null) => {
  if (!input) return '';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const ChatThreadList: React.FC<ChatThreadListProps> = ({
  threads,
  activeThreadId,
  onSelect,
  onThreadRead,
  onStartConversation,
  isCreating,
  errorMessage,
  isLoading = false,
  canManage = false,
  showArchived = false,
  onToggleArchived,
  onArchiveThread,
  onUnarchiveThread,
  onDeleteThread,
  actionDisabled = false,
  actionErrorMessage = null,
}) => {
  const [email, setEmail] = useState('');
  const [optimisticallyReadThreadIds, setOptimisticallyReadThreadIds] = useState<Record<string, true>>({});
  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [threads]);

  const filteredThreads = useMemo(() => {
    return sortedThreads.filter((thread) => (showArchived ? thread.archived : !thread.archived));
  }, [sortedThreads, showArchived]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      return;
    }
    try {
      await onStartConversation(trimmed);
      setEmail('');
    } catch {
      // Error surface handled by parent via errorMessage prop
    }
  };

  return (
    <aside className="tw-w-full tw-max-w-sm tw-border-r tw-border-gray-200 tw-bg-white tw-flex tw-flex-col tw-h-full">
      <div className="tw-p-4 tw-border-b tw-border-gray-200">
        <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Messages</h2>
        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">Start a new chat by inviting a mentor or mentee via email.</p>
        <form className="tw-mt-3 tw-space-y-2" onSubmit={handleSubmit}>
          <label htmlFor="new-chat-email" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
            Participant email
          </label>
          <input
            id="new-chat-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="tw-w-full tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
            placeholder="name@example.com"
          />
          {errorMessage ? (
            <p className="tw-text-sm tw-text-red-600" role="alert">{errorMessage}</p>
          ) : null}
          <button
            type="submit"
            disabled={isCreating}
            className="tw-w-full tw-rounded-md tw-bg-blue-600 tw-text-white tw-py-2 tw-text-sm tw-font-medium hover:tw-bg-blue-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-ring-offset-2 disabled:tw-opacity-50"
          >
            {isCreating ? 'Starting…' : 'Start conversation'}
          </button>
        </form>
        {canManage && onToggleArchived ? (
          <label className="tw-mt-4 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => onToggleArchived(event.target.checked)}
              className="tw-h-4 tw-w-4 tw-rounded tw-border tw-border-gray-300"
            />
            Show archived chats
          </label>
        ) : null}
        {actionErrorMessage ? (
          <p className="tw-mt-2 tw-text-xs tw-text-red-600" role="alert">{actionErrorMessage}</p>
        ) : null}
      </div>
      <div className="tw-flex-1 tw-overflow-y-auto tw-relative">
        {isLoading ? (
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-white tw-bg-opacity-70">
            <div className="tw-animate-spin tw-rounded-full tw-h-6 tw-w-6 tw-border-b-2 tw-border-blue-500" aria-label="Loading conversations" />
          </div>
        ) : null}
        {filteredThreads.length === 0 ? (
          <div className="tw-p-6 tw-text-center tw-text-sm tw-text-gray-500">
            {showArchived ? 'No archived conversations.' : 'No conversations yet. Start one above.'}
          </div>
        ) : (
          <ul>
            {filteredThreads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              const counterpart = thread.counterpart ?? thread.mentor ?? thread.mentee;
              const threadTitle = thread.title || counterpart?.name || 'Conversation';
              const timestamp = thread.type === 'session' && thread.session?.date
                ? formatTimestamp(thread.session.date)
                : formatTimestamp(thread.lastMessageAt);
              const previewText = thread.type === 'session'
                ? `${thread.participants.length} participant${thread.participants.length === 1 ? '' : 's'}`
                : thread.lastMessage || 'Start chatting…';
              const counterpartLabel = counterpart?.name && counterpart?.name !== threadTitle ? counterpart.name : null;
              const participantNames = thread.type === 'session'
                ? thread.participants.map((participant) => participant.name).join(', ')
                : '';
              const unreadCount = optimisticallyReadThreadIds[thread.id] ? 0 : thread.unreadCount;
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (thread.unreadCount > 0) {
                        setOptimisticallyReadThreadIds((current) => ({
                          ...current,
                          [thread.id]: true,
                        }));
                      }
                      onThreadRead?.(thread.id);
                      onSelect(thread.id);
                    }}
                    className={`tw-w-full tw-text-left tw-px-4 tw-py-3 tw-flex tw-items-start tw-space-x-3 hover:tw-bg-gray-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 ${
                      isActive ? 'tw-bg-gray-100 tw-border-l-4 tw-border-blue-500' : 'tw-border-l-4 tw-border-transparent'
                    }`}
                  >
                    <div className="tw-flex-1">
                      <div className="tw-flex tw-justify-between tw-items-center">
                        <span className="tw-font-medium tw-text-gray-900">
                          {threadTitle}
                          {thread.type === 'session' ? (
                            <span className="tw-ml-2 tw-inline-flex tw-items-center tw-rounded-full tw-bg-blue-50 tw-text-blue-700 tw-text-[11px] tw-font-semibold tw-px-2 tw-py-0.5">
                              Session
                            </span>
                          ) : null}
                          {thread.archived ? (
                            <span className="tw-ml-2 tw-inline-flex tw-items-center tw-rounded-full tw-bg-gray-100 tw-text-gray-600 tw-text-[11px] tw-font-semibold tw-px-2 tw-py-0.5">
                              Archived
                            </span>
                          ) : null}
                        </span>
                        <span className="tw-text-xs tw-text-gray-500">{timestamp}</span>
                      </div>
                      <p className="tw-text-sm tw-text-gray-600 tw-truncate">{previewText}</p>
                      {counterpartLabel ? (
                        <p className="tw-text-xs tw-text-gray-500 tw-truncate">{counterpartLabel}</p>
                      ) : null}
                      {thread.type === 'session' && participantNames ? (
                        <p className="tw-text-xs tw-text-gray-500 tw-mt-1 tw-truncate">
                          {thread.session?.room ? `${thread.session.room} · ` : ''}
                          {participantNames}
                        </p>
                      ) : null}
                    </div>
                    {unreadCount > 0 ? (
                      <span className="tw-ml-2 tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-blue-600 tw-text-white tw-text-xs tw-font-semibold tw-h-5 tw-min-w-[1.5rem]">
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>
                  {canManage ? (
                    <div className="tw-flex tw-gap-2 tw-pl-4 tw-pr-4 tw-pb-3">
                      <button
                        type="button"
                        className="tw-text-xs tw-font-medium tw-text-gray-600 hover:tw-text-gray-900 tw-transition-colors"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (thread.archived) {
                            onUnarchiveThread?.(thread.id);
                          } else {
                            onArchiveThread?.(thread.id);
                          }
                        }}
                        disabled={actionDisabled}
                      >
                        {thread.archived ? 'Unarchive' : 'Archive'}
                      </button>
                      <button
                        type="button"
                        className="tw-text-xs tw-font-medium tw-text-red-600 hover:tw-text-red-700 tw-transition-colors"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteThread?.(thread.id);
                        }}
                        disabled={actionDisabled}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default ChatThreadList;
