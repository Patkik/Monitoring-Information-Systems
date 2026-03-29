import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import logger from '../../shared/utils/logger';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useNotifications from '../../shared/hooks/useNotifications';

type UserSummary = {
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string;
  photoUrl?: string;
  profile?: {
    photoUrl?: string;
    displayName?: string;
  };
  applicationStatus?: string;
  applicationRole?: string;
};

type NavItem = {
  label: string;
  to: string;
  matches: string[];
  hash?: string;
};

const NAV_MAP: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', matches: ['/admin/dashboard'], hash: '' },
    { label: 'Matching', to: '/admin/matching', matches: ['/admin/matching'] },
    { label: 'Sessions', to: '/admin/sessions', matches: ['/admin/sessions'] },
    { label: 'Feedback', to: '/admin/feedback', matches: ['/admin/feedback'] },
    { label: 'Applications', to: '/admin/applications', matches: ['/admin/applications'] },
    { label: 'Users', to: '/admin/users', matches: ['/admin/users'] },
    { label: 'Announcements', to: '/admin/announcements', matches: ['/admin/announcements'] },
    { label: 'Recognition', to: '/admin/recognition', matches: ['/admin/recognition'] }
  ],
  mentor: [
    { label: 'Dashboard', to: '/mentor/dashboard', matches: ['/mentor/dashboard'] },
    { label: 'Sessions', to: '/mentor/sessions', matches: ['/mentor/sessions'] },
    { label: 'Availability', to: '/mentor/availability', matches: ['/mentor/availability'] },
    { label: 'Upload', to: '/mentor/materials/upload', matches: ['/mentor/materials/upload'] },
    { label: 'Recognition', to: '/mentor/recognition', matches: ['/mentor/recognition'] },
    { label: 'Announcements', to: '/mentor/announcements', matches: ['/mentor/announcements'] },
    { label: 'Chat', to: '/mentor/chat', matches: ['/mentor/chat'] }
  ],
  mentee: [
    { label: 'Home', to: '/mentee/dashboard', matches: ['/mentee/dashboard'] },
    { label: 'My Mentor', to: '/mentee/my-mentor', matches: ['/mentee/my-mentor'] },
    { label: 'Session', to: '/mentee/session', matches: ['/mentee/session'] },
    { label: 'Goals', to: '/mentee/goals', matches: ['/mentee/goals'] },
    { label: 'Apply', to: '/mentee/apply', matches: ['/mentee/apply'] },
    { label: 'Recognition', to: '/mentee/recognition', matches: ['/mentee/recognition'] },
    { label: 'Announcements', to: '/mentee/announcements', matches: ['/mentee/announcements'] },
    { label: 'Chat', to: '/mentee/chat', matches: ['/mentee/chat'] }
  ]
};

const HIDE_NAV_PATHS = new Set([
  '/mentee/application',
  '/mentee/pending',
  '/mentor/application',
  '/mentor/pending'
]);

const getStoredUser = (): UserSummary | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const normalizedRole = typeof parsed.role === 'string' ? parsed.role.toLowerCase() : undefined;
      return { ...parsed, role: normalizedRole };
    }
  } catch (error) {
    // Use centralized logger so production builds can silence these when desired
    logger.error('Failed to parse stored user:', error);
  }
  return null;
};

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<UserSummary | null>(() => getStoredUser());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    isFetching: notificationsFetching,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
    isMarkingRead,
    isMarkingAll,
  } = useNotifications({ enabled: !!user, subscribe: !!user, limit: 25 });

  useEffect(() => {
    const handleStorage = () => setUser(getStoredUser());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('user:updated', handleStorage as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('user:updated', handleStorage as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!dropdownOpen && !notifOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, notifOpen]);

  const notifLoading = notificationsLoading || notificationsFetching;

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
    } catch (error) {
      logger.error('Mark all notifications read failed:', error);
    }
  }, [markAllNotificationsRead]);

  const handleMarkOneRead = useCallback(
    async (id: string) => {
      try {
        await markNotificationRead(id);
      } catch (error) {
        logger.error('Mark notification read failed:', error);
      }
    },
    [markNotificationRead]
  );

  const navItems = useMemo(() => {
    if (!user?.role) {
      return [];
    }
    return NAV_MAP[user.role] || [];
  }, [user?.role]);

  const isActive = (item: NavItem) => {
    if (!item.matches.some((path) => location.pathname.startsWith(path))) {
      return false;
    }
    if (item.hash !== undefined) {
      return (location.hash || '') === item.hash;
    }
    return true;
  };

  const homePath = useMemo(() => {
    switch (user?.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'mentor':
        return '/mentor/dashboard';
      case 'mentee':
        return '/mentee/dashboard';
      default:
        return '/';
    }
  }, [user?.role]);

  const initials = useMemo(() => {
    if (!user) {
      return '?';
    }
    const first = user.firstname?.charAt(0) || '';
    const last = user.lastname?.charAt(0) || '';
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : (user.email?.charAt(0) || '?').toUpperCase();
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) {
      return 'Guest';
    }
    if (user.profile?.displayName) {
      return user.profile.displayName;
    }
    if (user.firstname || user.lastname) {
      return `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim();
    }
    return user.email || 'Account';
  }, [user]);

  const avatarUrl = useMemo(() => {
    const profilePhoto = typeof user?.profile === 'object' ? user?.profile?.photoUrl : undefined;
    return profilePhoto || user?.photoUrl || null;
  }, [user?.profile, user?.photoUrl]);

  const handleShowProfile = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setDropdownOpen(false);
    navigate('/login');
  };

  const hideNav = HIDE_NAV_PATHS.has(location.pathname);

  return (
    <header className="tw-bg-primary tw-text-white tw-shadow-lg">
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8">
        <div className="tw-flex tw-justify-between tw-items-center tw-py-4">
          <div className="tw-flex tw-items-center tw-space-x-2">
            <Link to={homePath} className="tw-inline-flex tw-items-center tw-gap-2">
              <h1 className="tw-text-2xl tw-font-bold">ComSoc</h1>
              {user?.role && (
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-white/20 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              )}
            </Link>
          </div>

          {!hideNav && navItems.length > 0 && (
            <nav className="tw-hidden md:tw-flex tw-items-center tw-space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`tw-font-medium tw-transition-colors ${
                    isActive(item)
                      ? 'tw-bg-white tw-text-primary tw-px-3 tw-py-1 tw-rounded'
                      : 'tw-text-white hover:tw-text-purple-200'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="tw-flex tw-items-center tw-space-x-3">
            {user && (
              <div className="tw-relative" ref={notifRef}>
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={() => setNotifOpen((o) => !o)}
                  className="tw-relative tw-h-10 tw-w-10 tw-rounded-full tw-bg-white/10 tw-flex tw-items-center tw-justify-center hover:tw-bg-white/20 tw-transition-colors"
                >
                  <svg className="tw-w-5 tw-h-5 tw-text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="tw-absolute tw--top-1 tw--right-1 tw-bg-red-500 tw-text-white tw-rounded-full tw-text-[10px] tw-leading-none tw-px-1.5 tw-py-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="tw-absolute tw-right-0 tw-mt-2 tw-w-80 tw-bg-white tw-text-gray-800 tw-rounded-lg tw-shadow-lg tw-border tw-border-gray-100 tw-z-50">
                    <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-2 tw-border-b tw-border-gray-100">
                      <span className="tw-text-sm tw-font-semibold">Notifications</span>
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="tw-text-xs tw-text-purple-600 hover:tw-text-purple-800 disabled:tw-opacity-50"
                        disabled={notifLoading || unreadCount === 0 || isMarkingAll}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="tw-max-h-80 tw-overflow-y-auto">
                      {notifLoading && (
                        <div className="tw-flex tw-justify-center tw-items-center tw-p-4">
                          <div className="tw-animate-spin tw-rounded-full tw-h-5 tw-w-5 tw-border-b-2 tw-border-purple-500" />
                        </div>
                      )}
                      {!notifLoading && notifications.length === 0 && (
                        <div className="tw-p-4 tw-text-sm tw-text-gray-500">No notifications yet.</div>
                      )}
                      {!notifLoading && notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleMarkOneRead(n.id)}
                          disabled={isMarkingRead}
                          className={`tw-w-full tw-text-left tw-px-4 tw-py-3 tw-text-sm hover:tw-bg-gray-50 ${!n.readAt ? 'tw-bg-purple-50' : ''} ${
                            isMarkingRead ? 'tw-opacity-70 tw-cursor-not-allowed' : ''
                          }`}
                        >
                          <p className="tw-font-medium tw-text-gray-900 tw-truncate">{n.title}</p>
                          <p className="tw-text-gray-600 tw-text-xs tw-mt-0.5 tw-line-clamp-2">{n.message}</p>
                          <p className="tw-text-gray-400 tw-text-[11px] tw-mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="tw-hidden sm:tw-flex tw-flex-col tw-items-end">
              <span className="tw-text-sm tw-font-semibold tw-leading-5">{displayName}</span>
              {user?.email && (
                <span className="tw-text-xs tw-text-white/80 tw-leading-4">{user.email}</span>
              )}
            </div>
            <div className="tw-relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className="tw-h-10 tw-w-10 tw-rounded-full tw-bg-white tw-flex tw-items-center tw-justify-center tw-overflow-hidden hover:tw-shadow-md tw-transition-shadow"
                aria-haspopup="menu"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Account avatar"
                    className="tw-h-full tw-w-full tw-object-cover"
                  />
                ) : (
                  <span className="tw-text-primary tw-font-semibold tw-uppercase">
                    {initials}
                  </span>
                )}
              </button>
              {dropdownOpen && (
                <div className="tw-absolute tw-right-0 tw-mt-2 tw-w-44 tw-bg-white tw-text-gray-700 tw-rounded-lg tw-shadow-lg tw-border tw-border-gray-100 tw-z-50">
                  <button
                    type="button"
                    onClick={handleShowProfile}
                    className="tw-w-full tw-text-left tw-px-4 tw-py-2 tw-text-sm hover:tw-bg-gray-100"
                  >
                    Show Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="tw-w-full tw-text-left tw-px-4 tw-py-2 tw-text-sm tw-text-red-600 hover:tw-bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

