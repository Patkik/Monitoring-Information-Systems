import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui';
import logger from '../../shared/utils/logger';

type StoredUser = {
  firstname?: string;
  lastname?: string;
};

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
    <Card className="tw-bg-primary tw-text-white tw-border-transparent tw-p-8 tw-mb-8">
      <h1 className="tw-text-3xl tw-font-bold tw-mb-4">
        {greetingName ? `Welcome back, ${greetingName}!` : 'Welcome back!'}
      </h1>
      <div className="tw-relative">
        <input
          id="welcome-search-input"
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
          className="tw-w-full tw-px-4 tw-py-3 tw-pl-12 tw-pr-12 tw-rounded-lg tw-bg-[var(--surface-secondary)] tw-text-[var(--text-primary)] tw-border tw-border-[var(--border-color)] placeholder:tw-text-[var(--text-muted)] focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/50 tw-transition-all"
          aria-label="Search mentors, sessions, or resources"
          title="Search mentors, sessions, or resources"
        />
        <svg className="tw-absolute tw-left-4 tw-top-3.5 tw-w-5 tw-h-5 tw-text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {query && (
            <button
              type="button"
              aria-label="Clear search"
              title="Clear search"
              onClick={() => {
                  setQuery('');
                  setActiveIndex(0);
                  setIsFocused(false);
              }}
              className="tw-absolute tw-right-4 tw-top-3.5 tw-text-[var(--text-muted)] hover:tw-text-[var(--text-secondary)] tw-transition-colors"
            >
              ✕
            </button>
        )}
        {isFocused && filteredShortcuts.length > 0 && (
            <div
              id="welcome-search-results"
              aria-label="Search suggestions"
              title="Search suggestions"
              className="tw-absolute tw-left-0 tw-right-0 tw-mt-2 tw-bg-[var(--surface-card)] tw-rounded-xl tw-shadow-[var(--shadow-md)] tw-border tw-border-[var(--border-color)] tw-z-10 tw-overflow-hidden"
            >
              {filteredShortcuts.map((shortcut, index) => (
                  <button
                    id={`welcome-search-option-${shortcut.id}`}
                    key={shortcut.id}
                    type="button"
                    aria-label={shortcut.label}
                    title={shortcut.label}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleNavigate(shortcut.path)}
                    className={`tw-w-full tw-text-left tw-px-4 tw-py-3 tw-transition tw-duration-150 ${
                        activeIndex === index
                            ? 'tw-bg-primary/10 tw-text-primary'
                            : 'hover:tw-bg-[var(--surface-hover)] tw-text-[var(--text-primary)]'
                    }`}
                  >
                    <p className="tw-font-semibold">{shortcut.label}</p>
                    <p className={`tw-text-sm ${activeIndex === index ? 'tw-text-primary/80' : 'tw-text-[var(--text-secondary)]'}`}>{shortcut.description}</p>
                  </button>
              ))}
            </div>
        )}
      </div>
    </Card>
  );
};

export default WelcomeBanner;

