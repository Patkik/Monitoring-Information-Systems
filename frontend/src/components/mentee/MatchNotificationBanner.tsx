import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../../shared/hooks/useNotifications';
import { NotificationItem } from '../../shared/services/notificationService';
import { Card, Button } from '../ui';

const MatchNotificationBanner: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    isLoading,
    error,
    markRead,
    isMarkingRead,
  } = useNotifications({ type: 'session', subscribe: true, limit: 25 });

  const latestMatch = useMemo(() => {
    const matches = notifications
      .filter((notification: NotificationItem) => notification.type === 'MENTORSHIP_MATCHED' && !notification.readAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return matches[0] || null;
  }, [notifications]);

  const onDismiss = useCallback(() => {
    if (latestMatch?.id && !isMarkingRead) {
      markRead(latestMatch.id);
    }
  }, [latestMatch, isMarkingRead, markRead]);

  if (isLoading || error || !latestMatch) {
    return null;
  }

  return (
    <Card className="tw-mb-4 tw-p-4 tw-border-emerald-200 tw-bg-emerald-50 dark:tw-bg-emerald-950/20 dark:tw-border-emerald-900/50">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-flex tw-items-start tw-gap-3">
          <span className="tw-text-emerald-600 tw-text-xl" aria-hidden>🎉</span>
          <div>
            <h3 className="tw-text-emerald-800 dark:tw-text-emerald-300 tw-font-semibold">{latestMatch.title || 'You have a new mentor match'}</h3>
            <p className="tw-text-emerald-700 dark:tw-text-emerald-400 tw-text-sm tw-mt-1">{latestMatch.message}</p>
            <div className="tw-mt-3 tw-flex tw-gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={() => navigate('/mentee/my-mentor')}
              >
                View mentor
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/mentee/session')}
                className="tw-text-emerald-700 hover:tw-bg-emerald-100 hover:tw-text-emerald-800 dark:tw-text-emerald-400 dark:hover:tw-bg-emerald-900/40 dark:hover:tw-text-emerald-300"
              >
                Schedule session
              </Button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="tw-text-emerald-700 hover:tw-text-emerald-900 dark:tw-text-emerald-500 dark:hover:tw-text-emerald-300 tw-text-sm tw-transition-colors"
          aria-label="Dismiss match notification"
        >
          Dismiss
        </button>
      </div>
    </Card>
  );
};

export default React.memo(MatchNotificationBanner);
