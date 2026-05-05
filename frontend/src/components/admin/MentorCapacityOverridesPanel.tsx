import React, { useMemo, useState } from 'react';
import { useMentorCapacities, useOverrideCapacity } from '../../features/admin/hooks/useMentorCapacity';
import { Card, Button, LoadingSpinner, EmptyState } from '../ui';

const MentorCapacityOverridesPanel: React.FC = () => {
  const { data: mentors = [], isLoading, error } = useMentorCapacities();
  const overrideMutation = useOverrideCapacity();
  const [formState, setFormState] = useState<Record<string, { capacity: string; reason: string }>>({});
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  const rows = useMemo(() => [...mentors].sort((a, b) => (a.name > b.name ? 1 : -1)), [mentors]);

  const updateField = (mentorId: string, field: 'capacity' | 'reason', value: string) => {
    setFormState((prev) => ({
      ...prev,
      [mentorId]: {
        capacity: field === 'capacity' ? value : prev[mentorId]?.capacity ?? '',
        reason: field === 'reason' ? value : prev[mentorId]?.reason ?? '',
      },
    }));
  };

  const handleSubmit = (mentorId: string, currentCapacity: number | null) => {
    const desired = formState[mentorId]?.capacity ?? (currentCapacity !== null ? String(currentCapacity) : '');
    const parsed = Number(desired);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setToast({ message: 'Capacity must be a positive number.', variant: 'error' });
      return;
    }
    overrideMutation.mutate(
      { mentorId, capacity: parsed, reason: formState[mentorId]?.reason?.trim() || undefined },
      {
        onSuccess: () => setToast({ message: 'Capacity updated.', variant: 'success' }),
        onError: (mutationError: unknown) =>
          setToast({ message: (mutationError as Error)?.message || 'Unable to update capacity.', variant: 'error' }),
      }
    );
  };

  if (isLoading) {
    return (
      <Card className="tw-p-12 tw-flex tw-justify-center">
        <LoadingSpinner label="Loading mentor capacities..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="tw-p-6">
        <p className="tw-text-sm tw-text-red-600 dark:tw-text-red-400">Unable to load mentor capacities. Try again later.</p>
      </Card>
    );
  }

  return (
    <Card className="tw-p-0 tw-overflow-hidden">
      <div className="tw-p-6 tw-border-b tw-border-[var(--border-color)]">
        <h2 className="tw-text-lg tw-font-semibold tw-text-[var(--text-primary)]">Mentor capacity overrides</h2>
        <p className="tw-text-sm tw-text-[var(--text-secondary)] tw-mt-1">
          Adjust mentor capacity when workloads change. Changes are logged to the audit trail.
        </p>
      </div>

      <div className="tw-overflow-x-auto">
        <table className="tw-min-w-full tw-text-sm">
          <thead className="tw-bg-[var(--surface-secondary)]">
            <tr className="tw-text-left tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider tw-border-b tw-border-[var(--border-color)]">
              <th className="tw-py-3 tw-px-6">Mentor</th>
              <th className="tw-py-3 tw-px-4 tw-text-right">Active</th>
              <th className="tw-py-3 tw-px-4 tw-text-right">Capacity</th>
              <th className="tw-py-3 tw-px-4 tw-text-right">Remaining</th>
              <th className="tw-py-3 tw-px-4">Reason (optional)</th>
              <th className="tw-py-3 tw-px-6" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="tw-divide-y tw-divide-[var(--border-color)] tw-bg-[var(--surface-card)]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState title="No mentors found" description="There are currently no mentors in the system." />
                </td>
              </tr>
            ) : (
              rows.map((mentor) => (
                <tr key={mentor.id} className="hover:tw-bg-[var(--surface-hover)] tw-transition-colors">
                  <td className="tw-py-3 tw-px-6">
                    <p className="tw-font-medium tw-text-[var(--text-primary)]">{mentor.name}</p>
                    <p className="tw-text-xs tw-text-[var(--text-tertiary)] tw-mt-0.5">{mentor.email}</p>
                  </td>
                  <td className="tw-py-3 tw-px-4 tw-text-right tw-text-[var(--text-secondary)]">{mentor.activeMentees}</td>
                  <td className="tw-py-3 tw-px-4 tw-text-right">
                    <input
                      type="number"
                      min={1}
                      className="tw-w-20 tw-text-right tw-bg-[var(--surface-background)] tw-border tw-border-[var(--border-color)] tw-rounded-md tw-px-2 tw-py-1.5 tw-text-[var(--text-primary)] focus:tw-ring-2 focus:tw-ring-primary/50 focus:tw-border-primary tw-outline-none tw-transition-all"
                      value={formState[mentor.id]?.capacity ?? (mentor.capacity !== null ? String(mentor.capacity) : '')}
                      onChange={(event) => updateField(mentor.id, 'capacity', event.target.value)}
                      aria-label={`Set capacity for ${mentor.name}`}
                    />
                  </td>
                  <td className="tw-py-3 tw-px-4 tw-text-right tw-text-[var(--text-secondary)]">{mentor.remainingSlots ?? '—'}</td>
                  <td className="tw-py-3 tw-px-4">
                    <input
                      type="text"
                      className="tw-w-full tw-min-w-[150px] tw-bg-[var(--surface-background)] tw-border tw-border-[var(--border-color)] tw-rounded-md tw-px-3 tw-py-1.5 tw-text-[var(--text-primary)] focus:tw-ring-2 focus:tw-ring-primary/50 focus:tw-border-primary tw-outline-none tw-transition-all placeholder:tw-text-[var(--text-muted)]"
                      value={formState[mentor.id]?.reason ?? ''}
                      onChange={(event) => updateField(mentor.id, 'reason', event.target.value)}
                      placeholder="Reason (internal)"
                    />
                  </td>
                  <td className="tw-py-3 tw-px-6 tw-text-right">
                    <Button
                      size="sm"
                      onClick={() => handleSubmit(mentor.id, mentor.capacity)}
                      loading={overrideMutation.isPending}
                    >
                      Save
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="tw-p-4 tw-border-t tw-border-[var(--border-color)] tw-bg-[var(--surface-secondary)]">
          <p
            className={`tw-text-sm tw-font-medium ${
              toast.variant === 'success'
                ? 'tw-text-emerald-600 dark:tw-text-emerald-400'
                : toast.variant === 'error'
                ? 'tw-text-red-600 dark:tw-text-red-400'
                : 'tw-text-[var(--text-secondary)]'
            }`}
            role="status"
          >
            {toast.message}
          </p>
        </div>
      )}
    </Card>
  );
};

export default MentorCapacityOverridesPanel;
