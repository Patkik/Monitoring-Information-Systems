import React, { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useUploadSessionMaterials } from '../../hooks/useMaterials';

interface MaterialUploadProps {
    sessionId: string;
    menteeIds?: string[];
    onUploadSuccess?: (uploadedCount: number) => void;
}

const MAX_FILES_PER_BATCH = 10;

const MaterialUpload: React.FC<MaterialUploadProps> = ({ sessionId, menteeIds, onUploadSuccess }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showFileList, setShowFileList] = useState(false);

    const uploadMutation = useUploadSessionMaterials(sessionId);

    const onFilesSelected = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        setError(null);
        setSuccessMessage(null);
        const next = Array.from(selectedFiles);
        if (next.length > MAX_FILES_PER_BATCH) {
            setError(`You can upload up to ${MAX_FILES_PER_BATCH} files at a time.`);
            setFiles(next.slice(0, MAX_FILES_PER_BATCH));
            return;
        }
        setFiles(next);
        setShowFileList(true);
    }, []);

    const removeFile = useCallback((name: string) => {
        setFiles((prev) => prev.filter((file) => file.name !== name));
    }, []);

    const handleSubmit = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();
            if (!files.length) {
                setError('Please select at least one file to upload.');
                return;
            }
            setSuccessMessage(null);
            try {
                await uploadMutation.mutateAsync({ files, menteeIds });
                setError(null);
                setFiles([]);
                setShowFileList(false);
                const uploadedCount = files.length;
                const message = uploadedCount === 1 ? 'File uploaded successfully.' : `${uploadedCount} files uploaded successfully.`;
                setSuccessMessage(message);
                onUploadSuccess?.(uploadedCount);
            } catch (unknownError) {
                setSuccessMessage(null);
                if (axios.isAxiosError(unknownError)) {
                    if (unknownError.code === 'ECONNABORTED') {
                        setError('Upload is taking longer than expected. Please check your connection and try again.');
                        return;
                    }

                    const apiMessage =
                        (unknownError.response?.data as { message?: string; error?: string } | undefined)?.message ||
                        (unknownError.response?.data as { message?: string; error?: string } | undefined)?.error;

                    setError(apiMessage || unknownError.message || 'Upload failed.');
                    return;
                }

                const fallbackMessage = unknownError instanceof Error ? unknownError.message : 'Upload failed.';
                setError(fallbackMessage);
            }
        },
        [files, menteeIds, uploadMutation],
    );

    const isLoading = uploadMutation.isPending;
    const hasFiles = files.length > 0;
    const fileSummary = useMemo(() => {
        if (!hasFiles) return '';
        if (files.length === 1) return files[0].name;
        return `${files.length} files selected`;
    }, [files, hasFiles]);

    return (
        <form onSubmit={handleSubmit} className="tw-space-y-4">
            <div>
                <label htmlFor="materials" className="tw-block tw-text-xs tw-font-bold tw-tracking-wide tw-uppercase tw-text-gray-500 tw-mb-2">
                    Upload materials
                </label>
                <input
                    id="materials"
                    name="materials"
                    type="file"
                    multiple
                    onChange={(e) => onFilesSelected(e.target.files)}
                    className="tw-block tw-w-full tw-text-sm tw-text-gray-900 tw-border tw-border-gray-200 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary tw-cursor-pointer tw-bg-white"
                    aria-describedby={error ? 'materials-error' : undefined}
                />
                {error && (
                    <p id="materials-error" className="tw-mt-2 tw-text-sm tw-text-red-600" role="alert">
                        {error}
                    </p>
                )}
                {successMessage && (
                    <p className="tw-mt-2 tw-text-sm tw-text-green-600" role="status" aria-live="polite">
                        {successMessage}
                    </p>
                )}
            </div>

            {hasFiles && showFileList && (
                <div className="tw-rounded-xl tw-border tw-border-gray-100 tw-bg-gray-50 tw-p-3 tw-space-y-2" aria-live="polite">
                    <div className="tw-flex tw-items-center tw-justify-between">
                        <p className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wide">Selected files</p>
                        <button
                            type="button"
                            onClick={() => setShowFileList(false)}
                            className="tw-text-xs tw-font-medium tw-text-gray-500 hover:tw-text-gray-700"
                        >
                            Hide
                        </button>
                    </div>
                    <ul className="tw-space-y-1">
                        {files.map((file) => (
                            <li key={file.name} className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-gray-600">
                                <span className="tw-truncate tw-max-w-[70%]" title={file.name}>
                                    {file.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(file.name)}
                                    className="tw-text-red-500 hover:tw-text-red-700"
                                    aria-label={`Remove ${file.name}`}
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="tw-flex tw-items-center tw-justify-between">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-2 tw-border tw-border-transparent tw-text-sm tw-font-semibold tw-rounded-lg tw-text-white tw-bg-primary hover:tw-bg-primary/90 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                >
                    {isLoading ? 'Uploading…' : 'Upload'}
                </button>
                {hasFiles && (
                    <button
                        type="button"
                        onClick={() => setShowFileList((prev) => !prev)}
                        className="tw-text-xs tw-font-medium tw-text-gray-600 hover:tw-text-gray-800"
                    >
                        {showFileList ? 'Hide file list' : fileSummary}
                    </button>
                )}
            </div>
        </form>
    );
};

MaterialUpload.propTypes = {
    sessionId: PropTypes.string.isRequired,
    menteeIds: PropTypes.arrayOf(PropTypes.string),
    onUploadSuccess: PropTypes.func,
};

export default React.memo(MaterialUpload);
