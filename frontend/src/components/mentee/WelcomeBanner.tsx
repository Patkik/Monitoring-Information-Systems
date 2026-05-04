import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type StoredUser = {
  firstname?: string;
  lastname?: string;
};

import logger from '../../shared/utils/logger';
const readUserFromStorage = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (err) {
    logger.error('Unable to read user from storage:', err);
    return null;
  }
};

type SearchShortcut = {
  id: string;
  label: string;
  description: string;
  path: string;
  keywords: string[];
};

const SEARCH_SHORTCUTS: SearchShortcut[] = [
  {
    id: 'my-mentor',
    label: 'My Mentor',
    description: 'View mentor details, goals, and handoffs.',
    path: '/mentee/my-mentor',
    keywords: ['mentor', 'mentorship', 'coach'],
  },
  {
    id: 'sessions',
    label: 'Sessions',
    description: 'Review upcoming or past mentorship sessions.',
    path: '/mentee/session',
    keywords: ['session', 'schedule', 'calendar'],
  },
  {
    id: 'apply',
    label: 'Apply for Mentoring',
    description: 'Submit or update your mentee application.',
    path: '/mentee/apply',
    keywords: ['apply', 'application', 'form'],
  },
  {
    id: 'recognition',
    label: 'Recognition',
    description: 'Celebrate milestones, badges, and achievements.',
    path: '/mentee/recognition',
    keywords: ['recognition', 'awards', 'badges', 'achievements'],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    description: 'Catch up on the latest program news.',
    path: '/mentee/announcements',
    keywords: ['announcements', 'news', 'updates'],
  },
  {
    id: 'chat',
    label: 'Chat',
    description: 'Continue conversations with mentors or peers.',
    path: '/mentee/session',
    keywords: ['chat', 'messages', 'conversation'],
  },
  {
    id: 'matches',
    label: 'Match Suggestions',
    description: 'Discover mentors suggested for you.',
    path: '/mentee/matches',
    keywords: ['match', 'suggestions', 'mentors'],
  },
];

const WelcomeBanner: React.FC = () => {
  const user = useMemo(() => readUserFromStorage(), []);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const greetingName = (user?.firstname || user?.lastname)
    ? `${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim()
    : '';

  const filteredShortcuts = useMemo(() => {
    if (!query.trim()) {
      return SEARCH_SHORTCUTS;
    }
    const normalized = query.trim().toLowerCase();
    return SEARCH_SHORTCUTS.filter((shortcut) => {
      return (
        shortcut.label.toLowerCase().includes(normalized) ||
        shortcut.description.toLowerCase().includes(normalized) ||
        shortcut.keywords.some((keyword) => keyword.toLowerCase().includes(normalized))
      );
    });
  }, [query]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsFocused(false);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!filteredShortcuts.length) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredShortcuts.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredShortcuts.length) % filteredShortcuts.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = filteredShortcuts[activeIndex] ?? filteredShortcuts[0];
      handleNavigate(target.path);
    } else if (event.key === 'Escape') {
      setIsFocused(false);
    }
  };

  return (
    <div className="tw-bg-primary tw-rounded-lg tw-p-8 tw-mb-8 tw-text-white">
      <h1 className="tw-text-3xl tw-font-bold tw-mb-4">
        {greetingName ? `Welcome back, ${greetingName}!` : 'Welcome back!'}
      </h1>
      <div className="tw-relative">
        <input
          type="text"
          placeholder="Search mentors, sessions, or resources..."
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="tw-w-full tw-px-4 tw-py-3 tw-pl-12 tw-pr-12 tw-rounded-lg tw-text-gray-900 tw-bg-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-300"
          aria-autocomplete="list"
          aria-expanded={isFocused}
          aria-controls="welcome-search-results"
        />
        {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                  setQuery('');
                  setActiveIndex(0);
                  setIsFocused(false);
              }}
              className="tw-absolute tw-right-3 tw-top-3 tw-text-gray-400 hover:tw-text-gray-600"
            >
              ✕
            </button>
        )}
        {isFocused && filteredShortcuts.length > 0 && (
            <div
              id="welcome-search-results"
              role="listbox"
              className="tw-absolute tw-left-0 tw-right-0 tw-mt-2 tw-bg-white tw-rounded-xl tw-shadow-lg tw-border tw-border-gray-100 tw-z-10"
            >
              {filteredShortcuts.map((shortcut, index) => (
                  <button
                    key={shortcut.id}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleNavigate(shortcut.path)}
                    className={`tw-w-full tw-text-left tw-px-4 tw-py-3 tw-transition tw-duration-150 ${
                        activeIndex === index
                            ? 'tw-bg-purple-50 tw-text-purple-800'
                            : 'hover:tw-bg-gray-50'
                    }`}
                  >
                    <p className="tw-font-semibold">{shortcut.label}</p>
                    <p className="tw-text-sm tw-text-gray-600">{shortcut.description}</p>
                  </button>
              ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeBanner;

