import React, { useMemo, useState } from 'react';
import { useCertificates, useSignCertificate } from '../../hooks/useCertificates';
import { downloadCertificate, CertificateSummary } from '../../shared/services/certificatesService';
import { useToast } from '../../hooks/useToast';

const formatDate = (value?: string | null) => {
    if (!value) {
        return '—';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }
    return parsed.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'tw-bg-emerald-50', text: 'tw-text-emerald-700', label: 'Active' },
    expired: { bg: 'tw-bg-amber-50', text: 'tw-text-amber-700', label: 'Expired' },
    revoked: { bg: 'tw-bg-red-50', text: 'tw-text-red-700', label: 'Revoked' },
};

const buildVerificationLink = (certificate: CertificateSummary) => {
    if (certificate.verificationUrl) {
        return certificate.verificationUrl;
    }
    const origin = window.location.origin;
    return `${origin}/verify/${certificate.verificationCode}`;
};

const MentorRecognitionPanel: React.FC = () => {
    const { data: certificates = [], isLoading, isError, isFetching, refetch } = useCertificates('mentor');
    const [searchTerm, setSearchTerm] = useState('');
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [signatureStatement, setSignatureStatement] = useState('');
    const [signatureTitle, setSignatureTitle] = useState('');
    const [selectedCertificate, setSelectedCertificate] = useState<CertificateSummary | null>(null);
    const { showToast } = useToast();
    const { mutateAsync: signCertificate, isLoading: isSigning } = useSignCertificate();

    const storedMentor = useMemo(() => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }, []);

    const defaultTitle = useMemo(() => {
        if (!storedMentor) {
            return 'Mentor';
        }
        return storedMentor.profile?.title || storedMentor.jobTitle || storedMentor.applicationRole || 'Mentor';
    }, [storedMentor]);

    const handleOpenSignatureModal = (certificate: CertificateSummary) => {
        setSelectedCertificate(certificate);
        setSignatureStatement(certificate.signature?.statement || '');
        setSignatureTitle(certificate.signature?.signedByTitle || defaultTitle);
        setSignatureModalOpen(true);
    };

    const handleCloseSignatureModal = () => {
        setSignatureModalOpen(false);
        setSelectedCertificate(null);
        setSignatureStatement('');
        setSignatureTitle(defaultTitle);
    };

    const handleSubmitSignature = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedCertificate) {
            return;
        }
        try {
            await signCertificate({
                certificateId: selectedCertificate.id,
                payload: {
                    statement: signatureStatement.trim() || undefined,
                    title: signatureTitle.trim() || undefined,
                },
            });
            showToast({ message: 'Certificate signed successfully.', variant: 'success' });
            handleCloseSignatureModal();
        } catch (error: any) {
            showToast({ message: error?.message || 'Unable to sign certificate.', variant: 'error' });
        }
    };

    const stats = useMemo(() => {
        const total = certificates.length;
        const pendingSignatures = certificates.filter((item) => item.signatureStatus !== 'signed').length;
        return {
            total,
            active: certificates.filter((item) => item.status === 'active').length,
            expired: certificates.filter((item) => item.status === 'expired').length,
            revoked: certificates.filter((item) => item.status === 'revoked').length,
            pendingSignatures,
        };
    }, [certificates]);

    const filteredCertificates = useMemo(() => {
        const needle = searchTerm.trim().toLowerCase();
        if (!needle) {
            return certificates;
        }
        return certificates.filter((certificate) => {
            const haystack = [
                certificate.menteeName,
                certificate.programName,
                certificate.certificateType,
                certificate.serialNumber,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(needle);
        });
    }, [certificates, searchTerm]);

    const handleDownload = async (certificateId: string) => {
        try {
            await downloadCertificate(certificateId);
            showToast({ message: 'Certificate PDF downloading…', variant: 'success' });
        } catch (error: any) {
            showToast({ message: error?.message || 'Unable to download certificate.', variant: 'error' });
        }
    };

    const handleCopyVerification = async (certificate: CertificateSummary) => {
        try {
            if (!navigator?.clipboard) {
                throw new Error('Clipboard API unavailable');
            }
            const link = buildVerificationLink(certificate);
            await navigator.clipboard.writeText(link);
            showToast({ message: 'Verification link copied to clipboard.', variant: 'success' });
        } catch (error: any) {
            showToast({ message: error?.message || 'Copy failed. Please try again.', variant: 'error' });
        }
    };

    return (
        <section className="tw-bg-white tw-border tw-border-gray-100 tw-rounded-xl tw-shadow-sm tw-p-6">
            <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-start tw-justify-between tw-gap-6">
                <div className="tw-space-y-2">
                    <p className="tw-text-xs tw-font-bold tw-tracking-wide tw-text-primary tw-uppercase">Recognition queue</p>
                    <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Certificates you’ve issued</h2>
                    <p className="tw-text-sm tw-text-gray-600">
                        Track which mentees have already received recognition, resend downloads, and quickly share verification links.
                    </p>
                </div>
                <div className="tw-grid tw-grid-cols-2 sm:tw-grid-cols-5 tw-gap-3">
                    {[
                        { label: 'Total issued', value: stats.total },
                        { label: 'Active', value: stats.active },
                        { label: 'Expired', value: stats.expired },
                        { label: 'Revoked', value: stats.revoked },
                        { label: 'Pending signatures', value: stats.pendingSignatures },
                    ].map((item) => (
                        <div key={item.label} className="tw-bg-gray-50 tw-rounded-xl tw-p-3 tw-text-center">
                            <p className="tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase">{item.label}</p>
                            <p className="tw-text-xl tw-font-bold tw-text-gray-900">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-3 tw-mt-6">
                <div className="tw-relative tw-flex-1">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search mentee, program, or serial number"
                            className="tw-w-full tw-px-4 tw-py-2 tw-pr-10 tw-border tw-border-gray-200 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary"
                        aria-label="Search certificates"
                    />
                    {searchTerm ? (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => setSearchTerm('')}
                            className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 hover:tw-text-gray-600"
                        >
                            ×
                        </button>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-4 tw-py-2 hover:tw-bg-gray-50 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-gray-200"
                >
                    Refresh
                    {isFetching ? (
                        <span className="tw-ml-2 tw-inline-flex tw-h-4 tw-w-4 tw-border-2 tw-border-gray-300 tw-border-t-transparent tw-rounded-full tw-animate-spin" aria-hidden="true" />
                    ) : null}
                </button>
            </div>

            {isError ? (
                <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl tw-p-4 tw-text-sm tw-text-red-700 tw-mt-4" role="alert">
                    Unable to load certificates. Please refresh the page.
                </div>
            ) : null}

            {isLoading ? (
                <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 tw-mt-6">
                    {[...Array(4)].map((_, index) => (
                        <div key={`certificate-skeleton-${index}`} className="tw-h-32 tw-bg-gray-100 tw-rounded-2xl tw-animate-pulse" />
                    ))}
                </div>
            ) : filteredCertificates.length === 0 ? (
                <div className="tw-mt-6 tw-rounded-2xl tw-border tw-border-dashed tw-border-gray-300 tw-p-8 tw-text-center">
                    <p className="tw-text-base tw-font-semibold tw-text-gray-900">No certificates yet</p>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                        Once mentees complete their programs, their certificates will appear here for quick follow-up.
                    </p>
                </div>
            ) : (
                <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 tw-mt-6">
                    {filteredCertificates.map((certificate) => {
                        const status = statusStyles[certificate.status] || statusStyles.active;
                        const typeLabel = certificate.certificateType && certificate.certificateType.length > 0
                            ? `${certificate.certificateType.charAt(0).toUpperCase()}${certificate.certificateType.slice(1)}`
                            : 'Certificate';
                        return (
                            <article key={certificate.id} className="tw-border tw-border-gray-100 tw-rounded-xl tw-p-4 tw-flex tw-flex-col tw-gap-3">
                                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                                    <div className="tw-space-y-0.5">
                                        <p className="tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase">Mentee</p>
                                        <p className="tw-text-base tw-font-semibold tw-text-gray-900">{certificate.menteeName || 'Unassigned'}</p>
                                        {certificate.menteeStudentId ? (
                                            <p className="tw-text-xs tw-text-gray-500">ID {certificate.menteeStudentId}</p>
                                        ) : null}
                                    </div>
                                    <div className="tw-flex tw-flex-col tw-items-end tw-gap-1">
                                        <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-semibold tw-rounded-full tw-px-2.5 tw-py-0.5 ${status.bg} ${status.text}`}>
                                            <span aria-hidden="true">●</span>
                                            {status.label}
                                        </span>
                                        <span
                                            className={`tw-inline-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-semibold tw-px-2.5 tw-py-0.5 tw-rounded-full ${
                                                certificate.signatureStatus === 'signed'
                                                    ? 'tw-bg-emerald-50 tw-text-emerald-700'
                                                    : 'tw-bg-amber-50 tw-text-amber-700'
                                            }`}
                                        >
                                            {certificate.signatureStatus === 'signed'
                                                ? `Signed ${formatDate(certificate.signature?.signedAt)}`
                                                : 'Signature pending'}
                                        </span>
                                    </div>
                                </div>
                                <div className="tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-1">
                                    <div>
                                        <p className="tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase">Program</p>
                                        <p className="tw-text-sm tw-font-medium tw-text-gray-900">{certificate.programName}</p>
                                    </div>
                                    <div>
                                        <p className="tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase">Issued</p>
                                        <p className="tw-text-sm tw-font-medium tw-text-gray-900">{formatDate(certificate.issuedAt)}</p>
                                    </div>
                                </div>
                                <div className="tw-flex tw-flex-wrap tw-gap-4">
                                    <div>
                                        <p className="tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase">Certificate</p>
                                        <p className="tw-text-xs tw-text-gray-500">
                                            {typeLabel} • Serial {certificate.serialNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase">Verification code</p>
                                        <p className="tw-text-sm tw-font-mono tw-text-gray-900">{certificate.verificationCode}</p>
                                    </div>
                                </div>
                                <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                                    {certificate.reissueCount ? (
                                        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-blue-50 tw-text-blue-700 tw-text-[11px] tw-font-semibold tw-px-2.5 tw-py-0.5">
                                            Reissued {certificate.reissueCount}×
                                        </span>
                                    ) : (
                                        <span className="tw-text-xs tw-text-gray-400">&nbsp;</span>
                                    )}
                                    <div className="tw-flex tw-flex-wrap tw-gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleDownload(certificate.id)}
                                            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-3 tw-py-1.5 hover:tw-bg-gray-50 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-gray-200"
                                        >
                                            Download PDF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyVerification(certificate)}
                                            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-gray-900 tw-text-white tw-text-sm tw-font-semibold tw-px-3 tw-py-1.5 hover:tw-bg-black/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-gray-900"
                                        >
                                            Copy link
                                        </button>
                                        {certificate.signatureStatus !== 'signed' ? (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenSignatureModal(certificate)}
                                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-white tw-text-sm tw-font-semibold tw-px-3 tw-py-1.5 hover:tw-bg-primary/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary"
                                            >
                                                Sign & verify
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {signatureModalOpen && selectedCertificate ? (
                <div
                    className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-50"
                    role="dialog"
                    aria-modal="true"
                    onClick={handleCloseSignatureModal}
                >
                    <div
                        className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-2xl tw-w-full tw-max-w-lg tw-p-6 tw-space-y-4"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <header className="tw-space-y-1">
                            <p className="tw-text-xs tw-font-semibold tw-text-primary tw-uppercase">Digital signature</p>
                            <h3 className="tw-text-2xl tw-font-bold tw-text-gray-900">Sign {selectedCertificate.menteeName}&rsquo;s certificate</h3>
                            <p className="tw-text-sm tw-text-gray-600">Your signature confirms you have verified this mentee completed the program requirements.</p>
                        </header>
                        <div className="tw-rounded-xl tw-bg-gray-50 tw-p-4 tw-space-y-2">
                            <div className="tw-flex tw-flex-wrap tw-gap-4">
                                <div>
                                    <p className="tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase">Program</p>
                                    <p className="tw-text-sm tw-font-medium tw-text-gray-900">{selectedCertificate.programName}</p>
                                </div>
                                <div>
                                    <p className="tw-text-[11px] tw-font-semibold tw-text-gray-500 tw-uppercase">Verification code</p>
                                    <p className="tw-text-sm tw-font-mono tw-text-gray-900">{selectedCertificate.verificationCode}</p>
                                </div>
                            </div>
                            <p className="tw-text-xs tw-text-gray-500">Serial {selectedCertificate.serialNumber}</p>
                        </div>
                        <form className="tw-space-y-4" onSubmit={handleSubmitSignature}>
                            <label className="tw-block">
                                <span className="tw-text-sm tw-font-semibold tw-text-gray-700">Add a short verification note (optional)</span>
                                <textarea
                                    value={signatureStatement}
                                    onChange={(event) => setSignatureStatement(event.target.value)}
                                    rows={3}
                                    maxLength={500}
                                    className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary"
                                    placeholder="E.g., Completed all capstone requirements and attended exit interview."
                                />
                            </label>
                            <label className="tw-block">
                                <span className="tw-text-sm tw-font-semibold tw-text-gray-700">Displayed title</span>
                                <input
                                    type="text"
                                    value={signatureTitle}
                                    onChange={(event) => setSignatureTitle(event.target.value)}
                                    className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/20 focus:tw-border-primary"
                                    placeholder="Mentor, Industry Coach, etc."
                                />
                            </label>
                            <div className="tw-flex tw-justify-end tw-gap-3">
                                <button
                                    type="button"
                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-4 tw-py-2 hover:tw-bg-gray-50"
                                    onClick={handleCloseSignatureModal}
                                    disabled={isSigning}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-white tw-text-sm tw-font-semibold tw-px-4 tw-py-2 hover:tw-bg-primary/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary disabled:tw-opacity-70"
                                    disabled={isSigning}
                                >
                                    {isSigning ? 'Signing…' : 'Sign certificate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

export default MentorRecognitionPanel;
