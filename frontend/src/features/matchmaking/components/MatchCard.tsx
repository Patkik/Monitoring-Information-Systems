import React, { useState } from 'react';
import type { MatchSuggestion } from '../types';
import { Card, Button, StatusBadge } from '../../../components/ui';

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
    <Card className="tw-p-5 tw-flex tw-flex-col tw-gap-4 hover:tw-shadow-[var(--shadow-md)] tw-transition-shadow">
      {/* Header - Minimalist */}
      <header className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-3">
          {mentee.photoUrl ? (
            <img src={mentee.photoUrl} alt={mentee.name} className="tw-w-10 tw-h-10 tw-rounded-full tw-object-cover tw-border tw-border-[var(--border-color)]" />
          ) : (
            <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-primary/10 tw-text-primary tw-flex tw-items-center tw-justify-center tw-font-semibold tw-text-sm tw-border tw-border-primary/20">
              {mentee.name?.[0] ?? '?'}
            </div>
          )}
          <div>
            <h3 className="tw-font-medium tw-text-[var(--text-primary)]">{mentee.name}</h3>
            <p className="tw-text-xs tw-text-[var(--text-secondary)] line-clamp-1">{mentee.education?.program || 'Program not provided'}</p>
          </div>
        </div>
        <div className="tw-text-right tw-flex tw-flex-col tw-items-end">
          <div className="tw-inline-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-rounded-full tw-bg-emerald-50 dark:tw-bg-emerald-950/30 tw-text-emerald-700 dark:tw-text-emerald-400 tw-font-bold tw-text-sm tw-border tw-border-emerald-100 dark:tw-border-emerald-800">
            {score}
          </div>
          <p className="tw-text-[10px] tw-text-[var(--text-muted)] tw-mt-1 tw-uppercase tw-tracking-wider">{statusLabel}</p>
        </div>
      </header>

      {/* Focus Area Pill Summary directly on card */}
      {!showDetails && allMenteeTags.length > 0 && (
         <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-mt-1">
           {allMenteeTags.slice(0, 3).map((tag, i) => (
             <span key={i} className="tw-text-[10px] tw-bg-[var(--surface-secondary)] tw-text-[var(--text-secondary)] tw-px-2 tw-py-0.5 tw-rounded-md tw-border tw-border-[var(--border-color)]">
               {tag}
             </span>
           ))}
           {allMenteeTags.length > 3 && (
             <span className="tw-text-[10px] tw-text-[var(--text-muted)] tw-pl-1 tw-self-center">+{allMenteeTags.length - 3} more</span>
           )}
         </div>
      )}

      {/* Details Section */}
      {showDetails && (
        <div className="tw-mt-2 tw-pt-4 tw-border-t tw-border-[var(--border-color)] tw-space-y-5">
          <div>
            <h4 className="tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider tw-mb-2">Match Analysis</h4>
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2">
              {Object.entries(scoreBreakdown).map(([key, value]) => (
                <div key={key} className="tw-bg-[var(--surface-secondary)] tw-rounded-lg tw-p-2 tw-text-center tw-border tw-border-[var(--border-color)]">        
                  <p className="tw-text-[10px] tw-uppercase tw-text-[var(--text-tertiary)]">{key}</p>   
                  <p className="tw-font-medium tw-text-[var(--text-primary)]">{value}</p>        
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider tw-mb-2">Expertise Alignment</h4>
            <div className="tw-flex tw-flex-wrap tw-gap-1.5">
              {allMenteeTags.length > 0 ? allMenteeTags.map((tag, i) => (
                <span key={i} className="tw-text-[11px] tw-bg-primary/10 tw-text-primary tw-px-2 tw-py-1 tw-rounded-md tw-border tw-border-primary/20">
                  {tag}
                </span>
              )) : (
                <span className="tw-text-[var(--text-muted)] tw-text-xs tw-italic">No expertise tags provided</span>
              )}
            </div>
          </div>

          {mentee.availabilitySlots && mentee.availabilitySlots.length > 0 && (
            <div>
              <h4 className="tw-text-xs tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider tw-mb-2">Availability Overlap</h4>
              <ul className="tw-space-y-1.5">
                {mentee.availabilitySlots.map((slot, i) => (
                  <li key={i} className="tw-text-xs tw-text-[var(--text-primary)] tw-flex tw-items-center tw-gap-2 tw-bg-[var(--surface-secondary)] tw-px-2 tw-py-1 tw-rounded-md tw-w-fit tw-border tw-border-[var(--border-color)]">
                    <span className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-emerald-500"></span>
                    <span className="tw-font-medium">{slot.day}</span>
                    {slot.start && slot.end && <span className="tw-text-[var(--text-secondary)]">({slot.start} - {slot.end})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer Area with Buttons */}
      <footer className="tw-flex tw-items-center tw-justify-between tw-mt-2 tw-pt-3 tw-border-t tw-border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="tw-text-xs tw-font-medium tw-text-primary hover:tw-text-primary/80 tw-transition-colors tw-flex tw-items-center tw-gap-1"
        >
          {showDetails ? 'Hide details' : 'View match detail'}
          <span className="tw-text-[10px]">{showDetails ? '▲' : '▼'}</span>
        </button>

        <div className="tw-flex tw-items-center tw-gap-2">
          {onViewProfile && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onViewProfile}
            >
              Profile
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={onDecline}
            loading={isDeclining}
            disabled={isDeclining}
          >
            Decline
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onAccept}
            disabled={disableAccept || isAccepting}
            loading={isAccepting}
          >
            {disableAccept ? 'Full' : 'Accept'}
          </Button>
        </div>
      </footer>
    </Card>
  );
};

export default MatchCard;
