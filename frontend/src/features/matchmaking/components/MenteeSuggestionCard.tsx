import React from 'react';
import type { MatchSuggestion } from '../types';

interface Props {
  suggestion: MatchSuggestion;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

const statusColor: Record<string, string> = {
  suggested: 'tw-text-gray-600',
  mentor_accepted: 'tw-text-green-600',
  mentee_accepted: 'tw-text-amber-600',
  connected: 'tw-text-emerald-600',
};

const MenteeSuggestionCard: React.FC<Props> = ({ suggestion, onAccept, onDecline, isAccepting, isDeclining }) => {
  const mentor = suggestion.mentor || { name: 'Mentor match pending' };
  const expertiseList = mentor.expertiseAreas || [];
  const statusLabel = suggestion.status.replace('_', ' ');
  const availabilityValue = suggestion.metadata?.availabilityOverlap;
  const availabilityDisplay =
    typeof availabilityValue === 'number'
      ? `${availabilityValue}%`
      : typeof availabilityValue === 'string'
      ? availabilityValue
      : undefined;

  return (
    <article className="tw-bg-white tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-6 tw-flex tw-flex-col tw-gap-5">
      <header className="tw-flex tw-justify-between tw-gap-4 tw-items-start">
        <div>
          <p className="tw-text-sm tw-uppercase tw-text-purple-500 tw-font-semibold">Suggested mentor</p>
          <h3 className="tw-text-2xl tw-font-bold tw-text-gray-900">{mentor.name || 'Mentor match'}</h3>
          <p className="tw-text-sm tw-text-gray-500">{mentor.bio || mentor.email || 'Review and respond to this suggestion.'}</p>
        </div>
        <div className="tw-text-right">
          <p className={`tw-text-xs tw-uppercase ${statusColor[suggestion.status] || 'tw-text-gray-500'}`}>{statusLabel}</p>
          {typeof mentor.capacity === 'number' && (
            <p className="tw-text-xs tw-text-gray-400">Capacity {mentor.capacity} mentees</p>
          )}
        </div>
      </header>

      <section>
        <p className="tw-text-sm tw-font-semibold tw-text-gray-900">Expertise focus</p>
        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-2">
          {expertiseList.slice(0, 4).map((tag) => (
            <span key={tag} className="tw-text-xs tw-bg-gray-100 tw-text-gray-700 tw-rounded-full tw-px-3 tw-py-1">
              {tag}
            </span>
          ))}
          {!expertiseList.length && <span className="tw-text-xs tw-text-gray-500">No expertise tags provided.</span>}
        </div>
      </section>

      <section className="tw-grid tw-grid-cols-2 tw-gap-3">
        <div className="tw-bg-purple-50 tw-rounded-xl tw-p-3">
          <p className="tw-text-xs tw-uppercase tw-text-purple-500">Match score</p>
          <p className="tw-text-2xl tw-font-bold tw-text-purple-700">{suggestion.score.toFixed(2)}</p>
        </div>
        <div className="tw-bg-gray-50 tw-rounded-xl tw-p-3">
          <p className="tw-text-xs tw-uppercase tw-text-gray-500">Availability overlap</p>
          <p className="tw-text-xl tw-font-semibold tw-text-gray-900">{availabilityDisplay ?? '—'}</p>
        </div>
      </section>

      <footer className="tw-flex tw-flex-wrap tw-justify-end tw-gap-3">
        <button
          type="button"
          onClick={onDecline}
          disabled={isDeclining}
          className="tw-border tw-border-red-200 tw-text-red-600 tw-rounded-full tw-px-4 tw-py-2 tw-text-sm hover:tw-bg-red-50 disabled:tw-opacity-50"
        >
          {isDeclining ? 'Declining…' : 'Decline'}
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={isAccepting}
          className="tw-bg-purple-600 tw-text-white tw-rounded-full tw-px-5 tw-py-2 tw-text-sm hover:tw-bg-purple-700 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
        >
          {isAccepting ? 'Accepting…' : 'Accept match'}
        </button>
      </footer>
    </article>
  );
};

export default React.memo(MenteeSuggestionCard);
