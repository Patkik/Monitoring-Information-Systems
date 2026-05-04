import React, { useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminPairingsTable from '../../components/admin/AdminPairingsTable';
import PairingDetailModal from '../../components/admin/PairingDetailModal';
import { PairingFilters, PairingStatus, usePairingDetail, usePairings, useUpdatePairing } from '../../features/admin/hooks/usePairings';

type StatusFilter = 'all' | PairingStatus;

const statusFilterOptions: StatusFilter[] = ['all', 'active', 'paused', 'completed', 'cancelled'];

const MatchingPage: React.FC = () => {
    const [filters, setFilters] = useState<PairingFilters>({ page: 1, limit: 20, status: 'all', search: '' });
    const [searchDraft, setSearchDraft] = useState('');
    const [selectedPairingId, setSelectedPairingId] = useState<string | undefined>();
    const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

    const { data, isLoading, error, refetch } = usePairings(filters);
    const { data: detailData, isLoading: isDetailLoading, refetch: refetchDetail } = usePairingDetail(selectedPairingId);
    const updateMutation = useUpdatePairing();

    const pairings = data?.pairings ?? [];
    const paginationMeta = data?.meta;
    const page = paginationMeta?.page ?? filters.page ?? 1;
    const totalPages = paginationMeta?.totalPages ?? 1;
    const listError = error ? ((error as Error)?.message ?? 'Unable to load pairings.') : undefined;

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setFilters((prev) => ({ ...prev, search: searchDraft.trim(), page: 1 }));
    };

    const handleStatusChange = (value: string) => {
        setFilters((prev) => ({ ...prev, status: value as PairingFilters['status'], page: 1 }));
    };

    const handlePageChange = (direction: 'prev' | 'next') => {
        setFilters((prev) => {
            const currentPage = prev.page ?? 1;
            const target = direction === 'next' ? currentPage + 1 : currentPage - 1;
            const clamped = Math.max(1, Math.min(totalPages || 1, target));
            if (clamped === currentPage) {
                return prev;
            }
            return { ...prev, page: clamped };
        });
    };

    const closeModal = () => {
        setSelectedPairingId(undefined);
    };

    const handleSave = (
        payload: Partial<{ status: PairingStatus; notes: string | null; goals: string | null; program: string | null; reason?: string }>
    ) => {
        if (!selectedPairingId) {
            return;
        }
        updateMutation.mutate(
            { pairingId: selectedPairingId, payload },
            {
                onSuccess: () => {
                    setToast({ message: 'Pairing updated successfully.', variant: 'success' });
                    refetch();
                    refetchDetail();
                },
                onError: (mutationError) => {
                    const message =
                        (mutationError as any)?.response?.data?.message || (mutationError as Error)?.message || 'Unable to update pairing.';
                    setToast({ message, variant: 'error' });
                },
            }
        );
    };

    return (
        <AdminLayout>
            <div className="tw-space-y-6">
                <header className="tw-flex tw-flex-col tw-gap-3">
                    <div>
                        <p className="tw-text-sm tw-text-gray-500">Admin workspace</p>
                        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Matching</h1>
                    </div>
                    <p className="tw-text-gray-600 tw-text-sm md:tw-text-base">
                        Monitor every active mentorship, search for specific participants, and adjust pairings with an auditable trail.
                    </p>
                    <form className="tw-flex tw-flex-wrap tw-gap-3" onSubmit={handleSearchSubmit} role="search">
                        <div className="tw-flex tw-flex-1 tw-min-w-[220px] tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white">
                            <input
                                type="text"
                                className="tw-flex-1 tw-rounded-2xl tw-border-0 tw-px-4 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-purple-600"
                                placeholder="Search by mentor or mentee name/email"
                                value={searchDraft}
                                onChange={(event) => setSearchDraft(event.target.value)}
                                aria-label="Search pairings"
                            />
                            <button
                                type="submit"
                                className="tw-pr-4 tw-text-sm tw-font-semibold tw-text-purple-600 hover:tw-text-purple-800"
                            >
                                Search
                            </button>
                        </div>
                        <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
                            Status
                            <select
                                className="tw-rounded-2xl tw-border tw-border-gray-200 tw-bg-white tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-purple-600"
                                value={filters.status ?? 'all'}
                                onChange={(event) => handleStatusChange(event.target.value)}
                            >
                                {statusFilterOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option === 'all' ? 'All statuses' : option}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="tw-rounded-2xl tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-text-gray-900"
                        >
                            Refresh
                        </button>
                    </form>
                </header>

                <AdminPairingsTable
                    pairings={pairings}
                    isLoading={isLoading}
                    error={listError}
                    page={page || 1}
                    totalPages={totalPages || 1}
                    onPageChange={handlePageChange}
                    onInspect={(pairingId) => setSelectedPairingId(pairingId)}
                />

                {toast && (
                    <p
                        role="status"
                        className={`tw-text-sm ${toast.variant === 'success' ? 'tw-text-green-600' : 'tw-text-red-600'}`}
                    >
                        {toast.message}
                    </p>
                )}

                <PairingDetailModal
                    open={Boolean(selectedPairingId)}
                    pairing={detailData?.pairing}
                    auditTrail={detailData?.auditTrail}
                    isLoading={isDetailLoading}
                    isSaving={updateMutation.isPending}
                    error={updateMutation.isError ? ((updateMutation.error as Error)?.message ?? 'Update failed.') : undefined}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            </div>
        </AdminLayout>
    );
};

export default MatchingPage;
