import React, { useCallback, useState } from 'react';
import { useMentorshipRequests } from '../../features/mentorship/hooks/useMentorshipRequests';
import MenteeProfileDrawer from './MenteeProfileDrawer';

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const base = 'tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium';
  const map: Record<string, string> = {
    pending: 'tw-bg-yellow-100 tw-text-yellow-800',
    accepted: 'tw-bg-green-100 tw-text-green-800',
    declined: 'tw-bg-red-100 tw-text-red-800',
    withdrawn: 'tw-bg-gray-100 tw-text-gray-700',
  };
  const cls = map[status] || 'tw-bg-gray-100 tw-text-gray-800';
  return <span className={`${base} ${cls}`}>{status}</span>;
};

const MentorRequestsTable: React.FC = () => {
  const { requests, isLoading, isRefetching, meta, acceptRequest, declineRequest, isMutating } = useMentorshipRequests('mentor');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [lockedActionById, setLockedActionById] = useState<Record<string, boolean>>({});
  const [resolvedStatusById, setResolvedStatusById] = useState<Record<string, 'accepted' | 'declined'>>({});

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

    // ask for confirmation before sending
    const confirmed = window.confirm(
      `Confirm accepting this request${sessionSuggestion ? ` and suggesting "${sessionSuggestion}"` : ''}?`
    );
    if (!confirmed) return;

    setLockedActionById((prev) => ({ ...prev, [id]: true }));

    try {
      await acceptRequest(id, sessionSuggestion || undefined);
      setResolvedStatusById((prev) => ({ ...prev, [id]: 'accepted' }));
      // small success feedback
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
  }, [acceptRequest]);

  const handleDecline = useCallback(async (id: string) => {
    const declineReason = window.prompt('Provide a reason for declining (optional):');
    setLockedActionById((prev) => ({ ...prev, [id]: true }));

    try {
      await declineRequest(id, declineReason || undefined);
      setResolvedStatusById((prev) => ({ ...prev, [id]: 'declined' }));
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
  }, [declineRequest]);

  const computeMatchScore = useCallback((r: any) => {
    // Simple heuristic: base 50, +25 if they provided goals, +25 if notes provided
    let score = 50;
    if (r.goals) score += 25;
    if (r.notes) score += 25;
    return Math.min(100, score);
  }, []);

  if (isLoading && !isRefetching) {
    return (
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
        <div className="tw-animate-pulse tw-space-y-3">
          <div className="tw-h-5 tw-bg-gray-200 tw-rounded tw-w-1/3" />
          <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-full" />
          <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-5/6" />
          <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Mentorship Requests</h2>
        <div className="tw-text-sm tw-text-gray-500">Total: {meta.total} • Pending: {meta.pending}</div>
      </div>

      {requests.length === 0 ? (
        <div className="tw-text-gray-500">No requests yet.</div>
      ) : (
        <div className="tw-overflow-x-auto">
          <table className="tw-min-w-full tw-text-left tw-text-sm">
            <thead>
              <tr className="tw-border-b tw-border-gray-200 tw-text-gray-600">
                <th className="tw-py-2">Subject</th>
                <th className="tw-py-2">Mentee</th>
                <th className="tw-py-2">Requested</th>
                <th className="tw-py-2">Preferred Slot</th>
                <th className="tw-py-2">Status</th>
                <th className="tw-py-2 tw-text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const effectiveStatus = resolvedStatusById[r.id] || r.status;
                const isRowLocked = Boolean(lockedActionById[r.id]);

                return (
                <tr key={r.id} className="tw-border-b tw-border-gray-100 hover:tw-bg-gray-50/50">
                  <td className="tw-py-2 tw-pr-4 tw-font-medium tw-text-gray-900">{r.subject}</td>
                  <td className="tw-py-2 tw-pr-4">{r.mentee?.name || '—'}</td>
                  <td className="tw-py-2 tw-pr-4 tw-flex tw-items-center tw-gap-2">
                    <span>{r.mentee?.name || '—'}</span>
                    <button
                      type="button"
                      onClick={() => openProfile(r.mentee?.id ?? null)}
                      className="tw-text-xs tw-text-blue-600 hover:tw-underline"
                    >
                      View profile
                    </button>
                    <span className="tw-ml-2">
                      <span
                        className={`tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${
                          computeMatchScore(r) >= 75 ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-yellow-100 tw-text-yellow-800'
                        }`}
                      >
                        {computeMatchScore(r)}%
                      </span>
                    </span>
                  </td>
                  <td className="tw-py-2 tw-pr-4">{fmt(r.createdAt)}</td>
                  <td className="tw-py-2 tw-pr-4">{r.preferredSlot || '—'}</td>
                  <td className="tw-py-2 tw-pr-4"><StatusPill status={effectiveStatus} /></td>
                  <td className="tw-py-2 tw-pl-4">
                    <div className="tw-flex tw-gap-2 tw-justify-end">
                      {effectiveStatus === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={isMutating || isRowLocked}
                            onClick={() => handleAccept(r.id)}
                            className="tw-px-3 tw-py-1 tw-rounded tw-bg-green-600 hover:tw-bg-green-700 tw-text-white tw-text-xs tw-font-medium disabled:tw-opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={isMutating || isRowLocked}
                            onClick={() => handleDecline(r.id)}
                            className="tw-px-3 tw-py-1 tw-rounded tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-text-xs tw-font-medium disabled:tw-opacity-50"
                          >
                            Decline
                          </button>
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
    </div>
  );
};

export default MentorRequestsTable;
