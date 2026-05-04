import React, { useMemo, useState } from 'react';
import { useMentorCapacities, useOverrideCapacity } from '../../features/admin/hooks/useMentorCapacity';

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
    return <p className="tw-text-sm tw-text-gray-500">Loading mentor capacities…</p>;
  }

  if (error) {
    return <p className="tw-text-sm tw-text-red-600">Unable to load mentor capacities. Try again later.</p>;
  }

  return (
    <div className="tw-bg-white tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-6 tw-space-y-4">
      <header>
        <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900">Mentor capacity overrides</h2>
        <p className="tw-text-sm tw-text-gray-500">Adjust mentor capacity when workloads change. Changes are logged to the audit trail.</p>
      </header>

      <div className="tw-overflow-x-auto">
        <table className="tw-min-w-full tw-text-sm">
          <thead>
            <tr className="tw-text-left tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wider tw-border-b tw-border-gray-100">
              <th className="tw-py-3 tw-px-4">Mentor</th>
              <th className="tw-py-3 tw-px-4 tw-text-right">Active</th>
              <th className="tw-py-3 tw-px-4 tw-text-right">Capacity</th>
              <th className="tw-py-3 tw-px-4 tw-text-right">Remaining</th>
              <th className="tw-py-3 tw-px-4">Reason (optional)</th>
              <th className="tw-py-3 tw-px-4" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="tw-divide-y tw-divide-gray-100">
            {rows.map((mentor) => (
              <tr key={mentor.id}>
                <td className="tw-py-3 tw-px-4">
                  <p className="tw-font-medium tw-text-gray-900">{mentor.name}</p>
                  <p className="tw-text-xs tw-text-gray-500">{mentor.email}</p>
                </td>
                <td className="tw-py-3 tw-px-4 tw-text-right">{mentor.activeMentees}</td>
                <td className="tw-py-3 tw-px-4 tw-text-right">
                  <input
                    type="number"
                    min={1}
                    className="tw-w-20 tw-text-right tw-border tw-border-gray-300 tw-rounded-md tw-px-2 tw-py-1 focus:tw-ring-2 focus:tw-ring-purple-500"
                    value={formState[mentor.id]?.capacity ?? (mentor.capacity !== null ? String(mentor.capacity) : '')}
                    onChange={(event) => updateField(mentor.id, 'capacity', event.target.value)}
                    aria-label={`Set capacity for ${mentor.name}`}
                  />
                </td>
                <td className="tw-py-3 tw-px-4 tw-text-right">{mentor.remainingSlots ?? '—'}</td>
                <td className="tw-py-3 tw-px-4">
                  <input
                    type="text"
                    className="tw-w-48 tw-border tw-border-gray-300 tw-rounded-md tw-px-2 tw-py-1 focus:tw-ring-2 focus:tw-ring-purple-500"
                    value={formState[mentor.id]?.reason ?? ''}
                    onChange={(event) => updateField(mentor.id, 'reason', event.target.value)}
                    placeholder="Reason (internal)"
                  />
                </td>
                <td className="tw-py-3 tw-px-4 tw-text-right">
                  <button
                    type="button"
                    className="tw-bg-purple-600 tw-text-white tw-rounded-full tw-px-4 tw-py-1.5 tw-text-sm hover:tw-bg-purple-700 disabled:tw-opacity-50"
                    onClick={() => handleSubmit(mentor.id, mentor.capacity)}
                    disabled={overrideMutation.isPending}
                  >
                    {overrideMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && (
        <p
          className={`tw-text-sm ${
            toast.variant === 'success'
              ? 'tw-text-green-600'
              : toast.variant === 'error'
              ? 'tw-text-red-600'
              : 'tw-text-gray-600'
          }`}
          role="status"
        >
          {toast.message}
        </p>
      )}
    </div>
  );
};

export default MentorCapacityOverridesPanel;
