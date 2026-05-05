import React, { useEffect, useState } from 'react';
import { PairingRecord, PairingStatus } from '../../features/admin/hooks/usePairings';

interface AuditEntry {
    id: string;
    action: string;
    metadata: Record<string, unknown>;
    createdAt: string;
}

interface PairingDetailModalProps {
    open: boolean;
    pairing?: PairingRecord;
    auditTrail?: AuditEntry[];
    isLoading: boolean;
    isSaving: boolean;
    error?: string | null;
    onClose: () => void;
    onSave: (payload: Partial<{ status: PairingStatus; notes: string | null; goals: string | null; program: string | null; reason?: string }>) => void;
}

const statusOptions: PairingStatus[] = ['active', 'paused', 'completed', 'cancelled'];

const PairingDetailModal: React.FC<PairingDetailModalProps> = ({
    open,
    pairing,
    auditTrail,
    isLoading,
    isSaving,
    error,
    onClose,
    onSave,
}) => {
    const [formState, setFormState] = useState({
        status: pairing?.status ?? 'active',
        notes: pairing?.metadata?.notes ?? '',
        goals: pairing?.metadata?.goals ?? '',
        program: pairing?.metadata?.program ?? '',
        reason: '',
    });

    useEffect(() => {
        if (pairing) {
            setFormState({
                status: pairing.status,
                notes: pairing.metadata?.notes ?? '',
                goals: pairing.metadata?.goals ?? '',
                program: pairing.metadata?.program ?? '',
                reason: '',
            });
        }
    }, [pairing]);

    if (!open) {
        return null;
    }

    const handleChange = (field: keyof typeof formState, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
    };

    const normalizedValue = (value: string) => {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSave({
            status: formState.status as PairingStatus,
            notes: normalizedValue(formState.notes),
            goals: normalizedValue(formState.goals),
            program: normalizedValue(formState.program),
            reason: normalizedValue(formState.reason) ?? undefined,
        });
    };

    return (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40 tw-p-4">
            <div
                role="dialog"
                aria-modal="true"
                className="tw-w-full tw-max-w-3xl tw-rounded-3xl tw-bg-white tw-p-6 tw-shadow-2xl tw-space-y-6"
            >
                <header className="tw-flex tw-items-center tw-justify-between">
                    <div>
                        <p className="tw-text-sm tw-text-gray-500">Mentorship pairing</p>
                        <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-900">
                            {pairing?.mentor?.name ?? 'Mentor'} • {pairing?.mentee?.name ?? 'Mentee'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        aria-label="Close modal"
                        className="tw-rounded-full tw-border tw-border-gray-300 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-text-gray-600 hover:tw-text-gray-900"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Close
                    </button>
                </header>

                {isLoading && <p className="tw-text-sm tw-text-gray-500">Loading pairing details…</p>}

                {!isLoading && pairing && (
                    <form className="tw-space-y-4" onSubmit={handleSubmit}>
                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                            <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                                Status
                                <select
                                    className="tw-mt-1 tw-w-full tw-rounded-xl tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-purple-600"
                                    value={formState.status}
                                    onChange={(event) => handleChange('status', event.target.value)}
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                                Program / Track
                                <input
                                    type="text"
                                    className="tw-mt-1 tw-w-full tw-rounded-xl tw-border tw-border-gray-300 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-purple-600"
                                    value={formState.program}
                                    onChange={(event) => handleChange('program', event.target.value)}
                                />
                            </label>
                        </div>

                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                            Goals
                            <textarea
                                className="tw-mt-1 tw-w-full tw-rounded-xl tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-min-h-[80px] focus:tw-ring-2 focus:tw-ring-purple-600"
                                value={formState.goals}
                                onChange={(event) => handleChange('goals', event.target.value)}
                            />
                        </label>

                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                            Notes
                            <textarea
                                className="tw-mt-1 tw-w-full tw-rounded-xl tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-min-h-[80px] focus:tw-ring-2 focus:tw-ring-purple-600"
                                value={formState.notes}
                                onChange={(event) => handleChange('notes', event.target.value)}
                            />
                        </label>

                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                            Reason for change (visible to audit log only)
                            <textarea
                                className="tw-mt-1 tw-w-full tw-rounded-xl tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-min-h-[60px] focus:tw-ring-2 focus:tw-ring-purple-600"
                                value={formState.reason}
                                onChange={(event) => handleChange('reason', event.target.value)}
                                placeholder="Optional context for this update"
                            />
                        </label>

                        {error && <p className="tw-text-sm tw-text-red-600">{error}</p>}

                        <div className="tw-flex tw-justify-end tw-gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="tw-rounded-full tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm tw-text-gray-700"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="tw-rounded-full tw-bg-purple-600 tw-px-5 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-purple-700 disabled:tw-opacity-50"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                )}

                {!!auditTrail?.length && (
                    <section className="tw-border-t tw-border-gray-100 tw-pt-4">
                        <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700">Recent activity</h3>
                        <ul className="tw-mt-2 tw-space-y-2">
                            {auditTrail.map((entry) => (
                                <li key={entry.id} className="tw-rounded-xl tw-bg-gray-50 tw-p-3">
                                    <p className="tw-text-sm tw-font-medium tw-text-gray-900">{entry.action}</p>
                                    <p className="tw-text-xs tw-text-gray-500">
                                        {new Intl.DateTimeFormat('en', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        }).format(new Date(entry.createdAt))}
                                    </p>
                                    {!!entry.metadata?.reason && (
                                        <p className="tw-mt-1 tw-text-xs tw-text-gray-600">Reason: {String(entry.metadata.reason)}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </div>
    );
};

export default PairingDetailModal;
