import React, { useMemo, useState } from 'react';
import { useDeleteMaterial, useMentorMaterials, type MaterialItem } from '../../hooks/useMaterials';
import { useToast } from '../../hooks/useToast';

interface MentorMaterialsListProps {
    sessionId?: string;
}

const formatBytes = (value?: number) => {
    if (!value || Number.isNaN(value)) {
        return '—';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = value;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatDateTime = (value?: string) => {
    if (!value) {
        return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const MentorMaterialsList: React.FC<MentorMaterialsListProps> = ({ sessionId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);
    const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<MaterialItem | null>(null);

    const queryParams = useMemo(() => ({
        sessionId: sessionId || undefined,
        search: searchTerm.trim() || undefined,
    }), [sessionId, searchTerm]);

    const { data, isLoading, isError, isFetching, refetch } = useMentorMaterials(queryParams);
    const { showToast } = useToast();
    const deleteMutation = useDeleteMaterial();

    const materials: MaterialItem[] = data?.materials ?? [];
    const isEmpty = !isLoading && materials.length === 0;

    const openDeleteConfirmation = (material: MaterialItem) => {
        if (pendingDelete || deleteMutation.isLoading) {
            return;
        }
        setConfirmDeleteTarget(material);
    };

    const handleDelete = async () => {
        const materialId = confirmDeleteTarget?.id;
        if (!materialId) {
            return;
        }
        if (pendingDelete === materialId) {
            return;
        }

        setPendingDelete(materialId);
        try {
            await deleteMutation.mutateAsync(materialId);
            showToast({ message: 'Material deleted', variant: 'success' });
            setConfirmDeleteTarget(null);
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'An error occurred while deleting the material';
            showToast({ message, variant: 'error' });
        } finally {
            setPendingDelete(null);
        }
    };

    return (
        <section className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-space-y-4">
            <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center lg:tw-justify-between tw-gap-3">
                <div>
                    <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900">Uploaded files</h2>
                    <p className="tw-text-sm tw-text-gray-600">Review, download, or delete materials previously shared with mentees.</p>
                </div>
                <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-2 tw-w-full sm:tw-w-auto">
                    <div className="tw-relative tw-flex-1">
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search files"
                            className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                            aria-label="Search uploaded files"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 hover:tw-text-gray-600"
                                onClick={() => setSearchTerm('')}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-border-purple-400"
                        disabled={isFetching}
                    >
                        {isFetching ? 'Refreshing…' : 'Refresh'}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="tw-space-y-3" role="status" aria-live="polite">
                    {[...Array(3)].map((_, index) => (
                        <div key={`materials-skeleton-${index}`} className="tw-h-14 tw-rounded-lg tw-bg-gray-100 tw-animate-pulse" />
                    ))}
                </div>
            ) : null}

            {isError ? (
                <div className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-4" role="alert">
                    <p className="tw-text-sm tw-font-semibold tw-text-red-800">Unable to load uploaded files.</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="tw-mt-2 tw-text-sm tw-font-medium tw-text-red-700 hover:tw-text-red-900"
                    >
                        Retry
                    </button>
                </div>
            ) : null}

            {isEmpty ? (
                <div className="tw-text-center tw-text-sm tw-text-gray-500 tw-py-6">
                    {queryParams.sessionId ? 'No files for this session yet.' : 'No uploaded files found.'}
                </div>
            ) : null}

            {!isLoading && !isError && materials.length > 0 ? (
                <div className="tw-overflow-x-auto">
                    <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
                        <thead className="tw-bg-gray-50">
                            <tr>
                                <th className="tw-px-4 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">File</th>
                                <th className="tw-px-4 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Size</th>
                                <th className="tw-px-4 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Uploaded</th>
                                <th className="tw-px-4 tw-py-2 tw-text-right tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="tw-bg-white tw-divide-y tw-divide-gray-100">
                            {materials.map((material: MaterialItem) => (
                                <tr key={material.id}>
                                    <td className="tw-px-4 tw-py-3">
                                        <div className="tw-flex tw-flex-col">
                                            <span className="tw-text-sm tw-font-medium tw-text-gray-900">{material.title || material.originalName || 'Untitled file'}</span>
                                            {material.originalName ? (
                                                <span className="tw-text-xs tw-text-gray-500">{material.originalName}</span>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-gray-600">{formatBytes(material.fileSize)}</td>
                                    <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-gray-600">{formatDateTime(material.createdAt)}</td>
                                    <td className="tw-px-4 tw-py-3">
                                        <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
                                            {material.googleDriveDownloadLink ? (
                                                <a
                                                    href={material.googleDriveDownloadLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="tw-text-xs tw-font-semibold tw-text-blue-600 hover:tw-text-blue-800"
                                                >
                                                    Download
                                                </a>
                                            ) : null}
                                            <button
                                                type="button"
                                                onClick={() => openDeleteConfirmation(material)}
                                                className="tw-text-xs tw-font-semibold tw-text-red-600 hover:tw-text-red-800 disabled:tw-opacity-60"
                                                disabled={pendingDelete === material.id || deleteMutation.isLoading}
                                            >
                                                {pendingDelete === material.id ? 'Deleting…' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}

            {confirmDeleteTarget ? (
                <div
                    className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-gray-900/50 tw-p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-material-title"
                >
                    <div className="tw-w-full tw-max-w-md tw-rounded-xl tw-bg-white tw-p-6 tw-shadow-2xl tw-space-y-4">
                        <h3 id="delete-material-title" className="tw-text-lg tw-font-semibold tw-text-gray-900">
                            Delete material?
                        </h3>
                        <p className="tw-text-sm tw-text-gray-700">
                            Delete '{confirmDeleteTarget.title || confirmDeleteTarget.originalName || 'this material'}'? This cannot be undone.
                        </p>
                        <div className="tw-flex tw-justify-end tw-gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteTarget(null)}
                                className="tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-border-gray-400 disabled:tw-opacity-60"
                                disabled={deleteMutation.isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="tw-rounded-lg tw-bg-red-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-red-700 disabled:tw-opacity-60"
                                disabled={deleteMutation.isLoading}
                            >
                                {deleteMutation.isLoading ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

export default MentorMaterialsList;
