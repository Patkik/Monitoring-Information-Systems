import React from 'react';
import { Card } from '../ui';

const PeopleBehind: React.FC = () => {
  return (
    <Card className="tw-p-6">
      <div className="tw-flex tw-flex-col tw-gap-4">
        <div>
          <p className="tw-text-xs tw-uppercase tw-tracking-wider tw-text-primary tw-font-semibold tw-mb-1">People behind this</p>
          <h2 className="tw-text-2xl tw-font-bold tw-text-[var(--text-primary)]">Computer Society Organizational Chart</h2>
          <p className="tw-text-sm tw-text-[var(--text-secondary)] tw-mt-1">
            Meet the dedicated leaders and representatives powering the mentoring initiative.
          </p>
        </div>
        <div className="tw-rounded-xl tw-overflow-hidden tw-border tw-border-[var(--border-color)] tw-bg-[var(--surface-secondary)]">
          <img
            src="/people-behind-chart.png"
            alt="Computer Society organizational chart showing mentors and officers supporting the mentoring program"
            className="tw-w-full tw-h-auto"
            loading="lazy"
          />
        </div>
      </div>
    </Card>
  );
};

export default PeopleBehind;
