import React, { useState } from 'react';
import type { MatchSuggestion } from '../types';

interface MatchCardProps {
  suggestion: MatchSuggestion;
  onAccept: () => void;
  onDecline: () => void;
  disableAccept?: boolean;
  isAccepting?: boolean;
  isDeclining?: boolean;
  onViewProfile?: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  suggestion,
  onAccept,
  onDecline,
  disableAccept,
  isAccepting,
  isDeclining,
  onViewProfile,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { mentee, score, scoreBreakdown, status } = suggestion;
  const statusLabel = status.replace('_', ' ');

  const allMenteeTags = [...(mentee.expertiseAreas || []), ...(mentee.skills || [])];

  return (
    <article className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-5 tw-flex tw-flex-col tw-gap-4 hover:tw-shadow-md tw-transition-shadow">
      {/* Header - Minimalist */}
      <header className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-3">
          {mentee.photoUrl ? (
            <img src={mentee.photoUrl} alt={mentee.name} className="tw-w-10 tw-h-10 tw-rounded-full tw-object-cover tw-border tw-border-gray-100" />
          ) : (
            <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-purple-50 tw-text-purple-600 tw-flex tw-items-center tw-justify-center tw-font-semibold tw-text-sm tw-border tw-border-purple-100">
              {mentee.name?.[0] ?? '?'}
            </div>
          )}
          <div>
            <h3 className="tw-font-medium tw-text-gray-900">{mentee.name}</h3>
            <p className="tw-text-xs tw-text-gray-500 line-clamp-1">{mentee.education?.program || 'Program not provided'}</p>
          </div>
        </div>
        <div className="tw-text-right tw-flex tw-flex-col tw-items-end">
          <div className="tw-inline-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-rounded-full tw-bg-green-50 tw-text-green-700 tw-font-bold tw-text-sm tw-border tw-border-green-100">
            {score}
          </div>
          <p className="tw-text-[10px] tw-text-gray-400 tw-mt-1 tw-uppercase tw-tracking-wider">{statusLabel}</p>
        </div>
      </header>

      {/* Focus Area Pill Summary directly on card */}
      {!showDetails && allMenteeTags.length > 0 && (
         <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-mt-1">
           {allMenteeTags.slice(0, 3).map((tag, i) => (
             <span key={i} className="tw-text-[10px] tw-bg-gray-50 tw-text-gray-600 tw-px-2 tw-py-0.5 tw-rounded-md tw-border tw-border-gray-100">
               {tag}
             </span>
           ))}
           {allMenteeTags.length > 3 && (
             <span className="tw-text-[10px] tw-text-gray-400 tw-pl-1 tw-self-center">+{allMenteeTags.length - 3} more</span>
           )}
         </div>
      )}

      {/* Details Section */}
      {showDetails && (
        <div className="tw-mt-2 tw-pt-4 tw-border-t tw-border-gray-100 tw-space-y-5">
          <div>
            <h4 className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wider tw-mb-2">Match Analysis</h4>
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2">
              {Object.entries(scoreBreakdown).map(([key, value]) => (
                <div key={key} className="tw-bg-gray-50 tw-rounded-lg tw-p-2 tw-text-center tw-border tw-border-gray-100">        
                  <p className="tw-text-[10px] tw-uppercase tw-text-gray-500">{key}</p>   
                  <p className="tw-font-medium tw-text-gray-900">{value}</p>        
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wider tw-mb-2">Expertise Alignment</h4>
            <div className="tw-flex tw-flex-wrap tw-gap-1.5">
              {allMenteeTags.length > 0 ? allMenteeTags.map((tag, i) => (
                <span key={i} className="tw-text-[11px] tw-bg-purple-50 tw-text-purple-700 tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-purple-100">
                  {tag}
                </span>
              )) : (
                <span className="tw-text-gray-400 tw-text-xs tw-italic">No expertise tags provided</span>
              )}
            </div>
          </div>

          {mentee.availabilitySlots && mentee.availabilitySlots.length > 0 && (
            <div>
              <h4 className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-tracking-wider tw-mb-2">Availability Overlap</h4>
              <ul className="tw-space-y-1.5">
                {mentee.availabilitySlots.map((slot, i) => (
                  <li key={i} className="tw-text-xs tw-text-gray-700 tw-flex tw-items-center tw-gap-2 tw-bg-gray-50 tw-px-2 tw-py-1 tw-rounded-md tw-w-fit tw-border tw-border-gray-100">
                    <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-green-400"></span>
                    <span className="tw-font-medium">{slot.day}</span>
                    {slot.start && slot.end && <span className="tw-text-gray-500">({slot.start} - {slot.end})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer Area with Buttons */}
      <footer className="tw-flex tw-items-center tw-justify-between tw-mt-2 tw-pt-3 tw-border-t tw-border-gray-50">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="tw-text-xs tw-font-medium tw-text-purple-600 hover:tw-text-purple-800 tw-transition-colors tw-flex tw-items-center tw-gap-1"
        >
          {showDetails ? 'Hide details' : 'View match detail'}
          <span className="tw-text-[10px]">{showDetails ? '▲' : '▼'}</span>
        </button>

        <div className="tw-flex tw-items-center tw-gap-2">
          {onViewProfile && (
            <button
              type="button"
              onClick={onViewProfile}
              className="tw-text-xs tw-border tw-border-gray-200 tw-text-gray-700 tw-rounded-lg tw-px-3 tw-py-1.5 hover:tw-bg-gray-50 tw-transition-colors"
            >
              Profile
            </button>
          )}
          <button
            type="button"
            onClick={onDecline}
            disabled={isDeclining}
            className="tw-text-xs tw-border tw-border-red-100 tw-text-red-600 tw-rounded-lg tw-px-3 tw-py-1.5 hover:tw-bg-red-50 disabled:tw-opacity-50 tw-transition-colors"
          >
            {isDeclining ? '...' : 'Decline'}
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={disableAccept || isAccepting}
            className="tw-text-xs tw-bg-purple-600 tw-text-white tw-rounded-lg tw-px-4 tw-py-1.5 hover:tw-bg-purple-700 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition-colors tw-shadow-sm"
          >
            {disableAccept ? 'Full' : isAccepting ? 'Accepting...' : 'Accept'}
          </button>
        </div>
      </footer>
    </article>
  );
};

export default MatchCard;
