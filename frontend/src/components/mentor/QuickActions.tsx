import React from 'react';
import { Link } from 'react-router-dom';

// Accessible tiles providing fast navigation for mentors.
// Extend with additional actions (e.g., session scheduling, materials upload) later.
const actions: Array<{ label: string; description: string; to: string; icon: string; ariaLabel: string }> = [
    {
        label: 'Chat',
        description: 'Open conversations with your mentees',
        to: '/mentor/chat',
        icon: '💬',
        ariaLabel: 'Go to chat page'
    },
    {
        label: 'Upload',
        description: 'Share learning materials with mentees',
        to: '/mentor/materials/upload',
        icon: '📁',
        ariaLabel: 'Go to materials upload page'
    },
    {
        label: 'Matches',
        description: 'Review suggested mentees and take action',
        to: '/mentor/matches',
        icon: '🤝',
        ariaLabel: 'Go to mentor match suggestions page'
    },
    {
        label: 'Profile',
        description: 'Edit your public mentor profile',
        to: '/mentor/profile/edit',
        icon: '👤',
        ariaLabel: 'Go to mentor profile editor'
    },
    {
        label: 'Settings',
        description: 'Adjust notification and privacy preferences',
        to: '/profile/settings',
        icon: '⚙️',
        ariaLabel: 'Go to profile settings page'
    }
];

const QuickActions: React.FC = () => {
    return (
        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-4" aria-label="Mentor quick actions">
            {actions.map((a) => (
                <Link
                    key={a.label}
                    to={a.to}
                    aria-label={a.ariaLabel}
                    className="tw-group tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-5 tw-flex tw-flex-col tw-gap-2 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                >
                    <span className="tw-text-3xl" aria-hidden="true">
                        {a.icon}
                    </span>
                    <span className="tw-text-sm tw-font-semibold tw-text-gray-900">{a.label}</span>
                    <span className="tw-text-xs tw-text-gray-500">{a.description}</span>
                    <span className="tw-text-xs tw-text-purple-600 tw-font-medium tw-mt-auto group-hover:tw-underline">Open -&gt;</span>
                </Link>
            ))}
        </div>
    );
};

export default React.memo(QuickActions);
