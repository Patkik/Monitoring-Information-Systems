import React, { useEffect, useMemo, useState } from 'react';
import { useMentorFeedbackForSession, useCreateMentorFeedback, useUpdateMentorFeedback, useMenteeProgressSnapshot } from '../../shared/hooks/useMentorFeedback';
import { validateRating } from '../../shared/utils/feedbackValidator';

type Props = {
    sessionId: string;
    sessionSubject?: string | null;
    menteeId?: string | null;
    onClose: () => void;
    onSubmitted?: (message: string) => void;
    onSubmissionError?: (message: string) => void;
};

type CompetencyInput = { skillKey: string; level: number; notes: string };

const defaultCompetency = (): CompetencyInput => ({ skillKey: '', level: 1, notes: '' });

const MentorFeedbackForm: React.FC<Props> = ({ sessionId, sessionSubject, menteeId, onClose, onSubmitted, onSubmissionError }) => {
    const { data: existing, isLoading: isLoadingExisting } = useMentorFeedbackForSession(sessionId, { enabled: true });
    const createFeedback = useCreateMentorFeedback();
    const updateFeedback = useUpdateMentorFeedback();
    const { data: snapshot, isLoading: isLoadingSnapshot } = useMenteeProgressSnapshot(menteeId, { enabled: Boolean(menteeId) });

    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState('');
    const [competencies, setCompetencies] = useState<CompetencyInput[]>([]);
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [formError, setFormError] = useState<string | null>(null);
    const [ratingError, setRatingError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const resetFormState = () => {
        setRating(0);
        setComment('');
        setCompetencies([]);
        setVisibility('public');
        setFormError(null);
        setRatingError(null);
        setSuccessMsg(null);
    };

    const handleClose = () => {
        resetFormState();
        onClose();
    };

    useEffect(() => {
        if (existing) {
            setRating(existing.rating || 0);
            setComment(existing.comment || '');
            setVisibility(existing.visibility || 'public');
            setCompetencies(
                (existing.competencies || []).map((competency) => ({
                    skillKey: competency.skillKey || '',
                    level: competency.level || 1,
                    notes: competency.notes || '',
                }))
            );
        } else {
            resetFormState();
        }
    }, [existing, sessionId]);

    const isEdit = useMemo(() => Boolean(existing && existing.id), [existing]);
    const isSubmitting = createFeedback.isLoading || updateFeedback.isLoading;

    const handleRatingChange = (nextRating: number) => {
        setRating(nextRating);
        const ratingValidation = validateRating(nextRating);
        setRatingError(ratingValidation.valid ? null : ratingValidation.error);
    };

    const updateCompetency = (index: number, patch: Partial<CompetencyInput>) => {
        setCompetencies((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
    };

    const removeCompetency = (index: number) => {
        setCompetencies((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setFormError(null);
        setSuccessMsg(null);

        const ratingValidation = validateRating(rating);
        if (!ratingValidation.valid) {
            setRatingError(ratingValidation.error);
            setFormError(ratingValidation.error);
            return;
        }

        setRatingError(null);

        const normalizedCompetencies = competencies
            .map((competency) => ({
                skillKey: competency.skillKey.trim(),
                level: Number(competency.level),
                notes: competency.notes.trim(),
            }))
            .filter((competency) => competency.skillKey)
            .map((competency) => ({
                skillKey: competency.skillKey,
                level: Math.max(1, Math.min(5, competency.level || 1)),
                notes: competency.notes || undefined,
            }));

        const payload = {
            sessionId,
            rating,
            comment: comment.trim() || null,
            competencies: normalizedCompetencies,
            visibility,
        };

        try {
            if (isEdit) {
                await updateFeedback.mutateAsync(payload);
            } else {
                await createFeedback.mutateAsync(payload);
            }
            const message = isEdit ? 'Feedback updated.' : 'Feedback submitted.';
            setSuccessMsg(message);
            onSubmitted?.(message);
            handleClose();
        } catch (err: any) {
            const message = err?.message || 'Unable to submit feedback.';
            setFormError(message);
            onSubmissionError?.(message);
        }
    };

    if (isLoadingExisting) {
        return (
            <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40">
                <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-w-full tw-max-w-lg">Loading…</div>
            </div>
        );
    }

    return (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40" role="dialog" aria-modal="true">
            <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-xl tw-p-6">
                <div className="tw-flex tw-justify-between tw-items-start tw-mb-4">
                    <div>
                        <p className="tw-text-sm tw-font-semibold tw-text-primary">Mentor feedback</p>
                        <h3 className="tw-text-lg tw-font-bold tw-text-gray-900">{sessionSubject || 'Session feedback'}</h3>
                        <p className="tw-text-xs tw-text-gray-500">Share a short evaluation for the mentee.</p>
                    </div>
                    <div className="tw-flex tw-items-start tw-gap-4">
                        {isLoadingSnapshot ? (
                            <div className="tw-text-xs tw-text-gray-400">Loading mentee snapshot…</div>
                        ) : (snapshot ? (
                            <div className="tw-text-right">
                                <div className="tw-text-xs tw-text-gray-400">Mentee progress</div>
                                <div className="tw-text-sm tw-font-semibold tw-text-gray-900">{snapshot.ratingAvg.toFixed(2)}/5 • {snapshot.ratingCount}</div>
                            </div>
                        ) : null)}
                        <button type="button" onClick={handleClose} className="tw-text-gray-400 hover:tw-text-gray-600" aria-label="Close">×</button>
                    </div>
                </div>

                {formError ? (
                    <div className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700 tw-mb-3">{formError}</div>
                ) : null}

                {successMsg ? (
                    <div className="tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-p-3 tw-text-sm tw-text-green-700 tw-mb-3">{successMsg}</div>
                ) : null}

                <form onSubmit={handleSubmit} className="tw-space-y-4">
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700" htmlFor="mentor-feedback-rating-input">
                            Rating <span className="tw-text-red-500">*</span>
                        </label>
                        <input
                            id="mentor-feedback-rating-input"
                            type="number"
                            min={1}
                            max={5}
                            required
                            value={rating || ''}
                            onChange={(event) => handleRatingChange(Number(event.target.value))}
                            className="tw-mt-1 tw-w-24 tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                            aria-invalid={Boolean(ratingError)}
                            aria-describedby={ratingError ? 'mentor-feedback-rating-error' : undefined}
                        />
                        <div className="tw-flex tw-gap-2 tw-mt-2" role="radiogroup" aria-label="Rating">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <label key={value} className="tw-cursor-pointer">
                                    <input
                                        type="radio"
                                        name="rating"
                                        value={value}
                                        checked={rating === value}
                                        onChange={() => handleRatingChange(value)}
                                        className="tw-sr-only"
                                    />
                                    <span aria-hidden className={`tw-text-3xl ${value <= rating ? 'tw-text-amber-400' : 'tw-text-gray-300'}`}>★</span>
                                    <span className="tw-sr-only">{value} star{value>1?'s':''}</span>
                                </label>
                            ))}
                        </div>
                        {ratingError && (
                            <p id="mentor-feedback-rating-error" className="tw-mt-1 tw-text-xs tw-text-red-600">
                                {ratingError}
                            </p>
                        )}
                    </div>

                    <div>
                        <div className="tw-flex tw-items-center tw-justify-between">
                            <label className="tw-text-sm tw-font-medium tw-text-gray-700">Competencies (optional)</label>
                            <button
                                type="button"
                                onClick={() => setCompetencies((prev) => [...prev, defaultCompetency()])}
                                className="tw-rounded-md tw-border tw-border-gray-300 tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-text-gray-700 hover:tw-bg-gray-50"
                            >
                                Add competency
                            </button>
                        </div>

                        {competencies.length > 0 ? (
                            <div className="tw-mt-2 tw-space-y-2">
                                {competencies.map((competency, index) => (
                                    <div key={`competency-${index}`} className="tw-grid tw-grid-cols-12 tw-gap-2 tw-items-start">
                                        <input
                                            type="text"
                                            value={competency.skillKey}
                                            onChange={(event) => updateCompetency(index, { skillKey: event.target.value })}
                                            placeholder="Skill key"
                                            className="tw-col-span-4 tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                                        />
                                        <input
                                            type="number"
                                            min={1}
                                            max={5}
                                            value={competency.level}
                                            onChange={(event) => updateCompetency(index, { level: Number(event.target.value) })}
                                            placeholder="Level"
                                            className="tw-col-span-2 tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                                        />
                                        <input
                                            type="text"
                                            value={competency.notes}
                                            onChange={(event) => updateCompetency(index, { notes: event.target.value })}
                                            placeholder="Notes (optional)"
                                            className="tw-col-span-5 tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeCompetency(index)}
                                            className="tw-col-span-1 tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-px-2 tw-py-2 tw-text-xs tw-font-semibold tw-text-red-700 hover:tw-bg-red-100"
                                            aria-label="Remove competency"
                                        >
                                            x
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="tw-mt-1 tw-text-xs tw-text-gray-500">Add skills covered in this session if needed.</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="mentor-feedback-comment" className="tw-text-sm tw-font-medium tw-text-gray-700">Notes (optional)</label>
                        <textarea
                            id="mentor-feedback-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                            placeholder="Examples: progress against goals, focus areas, next steps"
                        />
                        <p className="tw-text-right tw-text-xs tw-text-gray-400">{comment.length}/2000</p>
                    </div>

                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Visibility</label>
                        <div className="tw-flex tw-gap-4">
                            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
                                <input type="radio" name="visibility" value="public" checked={visibility==='public'} onChange={() => setVisibility('public')} />
                                <span>Public (visible to mentee)</span>
                            </label>
                            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
                                <input type="radio" name="visibility" value="private" checked={visibility==='private'} onChange={() => setVisibility('private')} />
                                <span>Private (mentors only)</span>
                            </label>
                        </div>
                    </div>

                    <div className="tw-flex tw-justify-end tw-gap-3">
                        <button type="button" onClick={handleClose} className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="tw-rounded-lg tw-bg-primary tw-text-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold hover:tw-bg-primary/90 disabled:tw-opacity-60">{isEdit ? (isSubmitting ? 'Saving...' : 'Save feedback') : (isSubmitting ? 'Submitting...' : 'Submit feedback')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MentorFeedbackForm;
