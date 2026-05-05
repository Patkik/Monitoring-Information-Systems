import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMentorshipRequests } from '../../features/mentorship/hooks/useMentorshipRequests';
import MenteeProfileDrawer from './MenteeProfileDrawer';
import { Card, StatusBadge, Button, EmptyState, LoadingSpinner } from '../ui';

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '—');
const OPTIMISTIC_RECOVERY_TIMEOUT_MS = 10000;

const getStatusBadgeVariant = (status: string): "success" | "warning" | "error" | "info" | "neutral" => {
  switch (status) {
    case 'pending': return 'warning';
    case 'accepted': return 'success';
    case 'declined': return 'error';
    case 'withdrawn': return 'neutral';
    default: return 'neutral';
  }
};

const MentorRequestsTable: React.FC = () => {
  const { requests, isLoading, isRefetching, meta, acceptRequest, declineRequest } = useMentorshipRequests('mentor');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [lockedActionById, setLockedActionById] = useState<Record<string, boolean>>({});
  const [resolvedStatusById, setResolvedStatusById] = useState<Record<string, string>>({});
  const optimisticRecoveryTimersRef = useRef<Record<string, ReturnType<typeof window.setTimeout>>>({});

  const clearOptimisticRecoveryTimer = useCallback((id: string) => {
    const timer = optimisticRecoveryTimersRef.current[id];
    if (!timer) return;
    window.clearTimeout(timer);
    delete optimisticRecoveryTimersRef.current[id];
  }, []);

  const scheduleOptimisticRecovery = useCallback((id: string) => {
    clearOptimisticRecoveryTimer(id);

    optimisticRecoveryTimersRef.current[id] = window.setTimeout(() => {
      setResolvedStatusById((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });

      setLockedActionById((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });

      delete optimisticRecoveryTimersRef.current[id];
    }, OPTIMISTIC_RECOVERY_TIMEOUT_MS);
  }, [clearOptimisticRecoveryTimer]);

  useEffect(() => {
    return () => {
      Object.values(optimisticRecoveryTimersRef.current).forEach((timer) => {
        window.clearTimeout(timer);
      });
      optimisticRecoveryTimersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const statusById = new Map(requests.map((request) => [request.id, request.status]));

    setResolvedStatusById((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.entries(prev).forEach(([id, status]) => {
        const incomingStatus = statusById.get(id);

        if (!incomingStatus || incomingStatus === status || incomingStatus !== 'pending') {
          clearOptimisticRecoveryTimer(id);
          delete next[id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });

    setLockedActionById((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.keys(prev).forEach((id) => {
        const incomingStatus = statusById.get(id);
        if (!incomingStatus || incomingStatus !== 'pending') {
          clearOptimisticRecoveryTimer(id);
          delete next[id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
    Object.keys(optimisticRecoveryTimersRef.current).forEach((id) => {
      if (!statusById.has(id)) {
        clearOptimisticRecoveryTimer(id);
      }
    });
  }, [clearOptimisticRecoveryTimer, requests]);

  const openProfile = useCallback((id?: string | null) => {
    if (!id) return;
    setSelectedMenteeId(id);
    setDrawerOpen(true);
  }, []);

  const closeProfile = useCallback(() => {
    setDrawerOpen(false);
    setSelectedMenteeId(null);
  }, []);

  const handleAccept = useCallback(async (id: string) => {
    const sessionSuggestion = window.prompt('Suggest a first session slot (optional):');

    const confirmed = window.confirm(
      `Confirm accepting this request${sessionSuggestion ? ` and suggesting "${sessionSuggestion}"` : ''}?`
    );
    if (!confirmed) return;

    setLockedActionById((prev) => ({ ...prev, [id]: true }));

    try {
      await acceptRequest(id, sessionSuggestion || undefined);
      setResolvedStatusById((prev) => ({ ...prev, [id]: 'accepted' }));
      scheduleOptimisticRecovery(id);
      window.alert('Request accepted — mentee will be notified.');
    } catch (error) {
      void error;
      setLockedActionById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      window.alert('Unable to accept request. Please try again.');
    }
  }, [acceptRequest, scheduleOptimisticRecovery]);

  const handleDecline = useCallback(async (id: string) => {
    const declineReason = window.prompt('Provide a reason for declining (optional):');
    if (declineReason === null) return;

    setLockedActionById((prev) => ({ ...prev, [id]: true }));

    try {
      await declineRequest(id, declineReason || undefined);
      setResolvedStatusById((prev) => ({ ...prev, [id]: 'declined' }));
      scheduleOptimisticRecovery(id);
      window.alert('Request declined.');
    } catch (error) {
      void error;
      setLockedActionById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      window.alert('Unable to decline request. Please try again.');
    }
  }, [declineRequest, scheduleOptimisticRecovery]);

  const computeMatchScore = useCallback((r: any) => {
    let score = 50;
    if (r.goals) score += 25;
    if (r.notes) score += 25;
    return Math.min(100, score);
  }, []);

  if (isLoading && !isRefetching) {
    return (
      <Card className="tw-p-12 tw-flex tw-justify-center tw-items-center">
        <LoadingSpinner label="Loading requests..." size="lg" />
      </Card>
    );
  }

  return (
    <Card className="tw-p-0 tw-overflow-hidden tw-flex tw-flex-col tw-border-[var(--border-color)]">
      <div className="tw-px-6 tw-py-4 tw-border-b tw-border-[var(--border-color)] tw-bg-[var(--surface-secondary)] tw-flex tw-items-center tw-justify-between">
        <h2 className="tw-text-base tw-font-semibold tw-text-[var(--text-primary)]">Mentorship Requests</h2>
        <div className="tw-text-sm tw-text-[var(--text-secondary)]">Total: {meta.total} • Pending: {meta.pending}</div>
      </div>

      {requests.length === 0 ? (
        <EmptyState title="No requests yet" description="You don't have any pending mentorship requests." />
      ) : (
        <div className="tw-overflow-x-auto">
          <table className="tw-min-w-full tw-text-left tw-text-sm tw-divide-y tw-divide-[var(--border-color)]">
            <thead className="tw-bg-[var(--surface-secondary)]">
              <tr>
                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Subject</th>
                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Mentee</th>
                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Requested</th>
                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Preferred Slot</th>
                <th className="tw-px-6 tw-py-3.5 tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Status</th>
                <th className="tw-px-6 tw-py-3.5 tw-text-right tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="tw-divide-y tw-divide-[var(--border-color)] tw-bg-[var(--surface-card)]">
              {requests.map((r) => {
                const effectiveStatus = resolvedStatusById[r.id] || r.status;
                const isRowLocked = Boolean(lockedActionById[r.id]);

                return (
                <tr key={r.id} className="tw-transition-colors hover:tw-bg-[var(--surface-hover)]">
                  <td className="tw-px-6 tw-py-4 tw-font-medium tw-text-[var(--text-primary)]">{r.subject}</td>
                  <td className="tw-px-6 tw-py-4 tw-flex tw-items-center tw-gap-2">
                    <span className="tw-text-[var(--text-primary)]">{r.mentee?.name || '—'}</span>
                    <button
                      type="button"
                      onClick={() => openProfile(r.mentee?.id ?? null)}
                      className="tw-text-xs tw-text-primary hover:tw-underline tw-font-medium"
                    >
                      View profile
                    </button>
                    <span className="tw-ml-2">
                      <StatusBadge 
                        variant={computeMatchScore(r) >= 75 ? 'success' : 'warning'} 
                        label={`${computeMatchScore(r)}%`} 
                      />
                    </span>
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-text-[var(--text-secondary)]">{fmt(r.createdAt)}</td>
                  <td className="tw-px-6 tw-py-4 tw-text-[var(--text-secondary)]">{r.preferredSlot || '—'}</td>
                  <td className="tw-px-6 tw-py-4"><StatusBadge variant={getStatusBadgeVariant(effectiveStatus)} label={effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)} /></td>
                  <td className="tw-px-6 tw-py-4 tw-text-right">
                    <div className="tw-flex tw-gap-2 tw-justify-end">
                      {effectiveStatus === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            loading={isRowLocked}
                            disabled={isRowLocked}
                            onClick={() => handleAccept(r.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={isRowLocked}
                            disabled={isRowLocked}
                            onClick={() => handleDecline(r.id)}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      <MenteeProfileDrawer open={drawerOpen} onClose={closeProfile} menteeId={selectedMenteeId} />
    </Card>
  );
};

export default MentorRequestsTable;
