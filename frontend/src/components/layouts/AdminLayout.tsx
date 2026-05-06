import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useNotifications from '../../shared/hooks/useNotifications';
import logger from '../../shared/utils/logger';
import { useTheme } from '../../shared/contexts/ThemeContext';

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
};

const getStoredUser = (): UserSummary | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const normalizedRole = typeof parsed.role === 'string' ? parsed.role.toLowerCase() : undefined;
      return { ...parsed, role: normalizedRole };
    }
  } catch (error) {
    logger.error('Failed to parse stored user:', error);
  }
  return null;
};

// --- Icons (Inline SVGs, Lucide-style) ---
const Icons = {
  Menu: () => <svg xmlns="http://www.0000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  Moon: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  LogOut: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
  GitMerge: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  MessageSquare: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Star: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Folder: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>,
  Target: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const [user, setUser] = useState<UserSummary | null>(() => getStoredUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    isFetching: notificationsFetching,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
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
    if (!dropdownOpen && !notifOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, notifOpen]);

  // --- Navigation Configuration ---
  const adminNavGroups = [
    {
      label: 'System',
      items: [
        { label: 'Dashboard', to: '/admin/dashboard', matches: ['/admin/dashboard'], icon: <Icons.Home /> },
        { label: 'Capacity', to: '/admin/capacity', matches: ['/admin/capacity'], icon: <Icons.Users /> }
      ]
    },
    {
      label: 'People',
      items: [
        { label: 'Users', to: '/admin/users', matches: ['/admin/users'], icon: <Icons.Users /> },
        { label: 'Applications', to: '/admin/applications', matches: ['/admin/applications'], icon: <Icons.FileText /> }
      ]
    },
    {
      label: 'Operations',
      items: [
        { label: 'Matching', to: '/admin/matching', matches: ['/admin/matching'], icon: <Icons.GitMerge /> },
        { label: 'Sessions', to: '/admin/sessions', matches: ['/admin/sessions'], icon: <Icons.Calendar /> }
      ]
    },
    {
      label: 'Activity',
      items: [
        { label: 'Feedback', to: '/admin/feedback', matches: ['/admin/feedback'], icon: <Icons.MessageSquare /> },
        { label: 'Announcements', to: '/admin/announcements', matches: ['/admin/announcements'], icon: <Icons.Bell /> },
        { label: 'Recognition', to: '/admin/recognition', matches: ['/admin/recognition'], icon: <Icons.Star /> }
      ]
    }
  ];

  const mentorNavGroups = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', to: '/mentor/dashboard', matches: ['/mentor/dashboard'], icon: <Icons.Home /> }
      ]
    },
    {
      label: 'Mentorship',
      items: [
        { label: 'Sessions', to: '/mentor/sessions', matches: ['/mentor/sessions', '/mentor/chat'], icon: <Icons.Calendar /> },
        { label: 'My Mentees', to: '/mentor/roster', matches: ['/mentor/roster'], icon: <Icons.Users /> },
      ]
    },
    {
      label: 'Resources',
      items: [
        { label: 'Materials', to: '/mentor/materials/upload', matches: ['/mentor/materials/upload'], icon: <Icons.Folder /> }
      ]
    },
    {
      label: 'Activity',
      items: [
        { label: 'Announcements', to: '/mentor/announcements', matches: ['/mentor/announcements'], icon: <Icons.Bell /> },
        { label: 'Recognition', to: '/mentor/recognition', matches: ['/mentor/recognition'], icon: <Icons.Star /> }
      ]
    }
  ];

  const menteeNavGroups = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', to: '/mentee/dashboard', matches: ['/mentee/dashboard'], icon: <Icons.Home /> }
      ]
    },
    {
      label: 'Mentorship',
      items: [
        { label: 'My Mentor', to: '/mentee/my-mentor', matches: ['/mentee/my-mentor'], icon: <Icons.User /> },
        { label: 'Sessions', to: '/mentee/session', matches: ['/mentee/session', '/mentee/chat'], icon: <Icons.Calendar /> },
        { label: 'Apply', to: '/mentee/apply', matches: ['/mentee/apply'], icon: <Icons.FileText /> }
      ]
    },
    {
      label: 'Progress',
      items: [
        { label: 'Goals', to: '/mentee/goals', matches: ['/mentee/goals'], icon: <Icons.Target /> }
      ]
    },
    {
      label: 'Activity',
      items: [
        { label: 'Announcements', to: '/mentee/announcements', matches: ['/mentee/announcements'], icon: <Icons.Bell /> },
        { label: 'Recognition', to: '/mentee/recognition', matches: ['/mentee/recognition'], icon: <Icons.Star /> }
      ]
    }
  ];

  const navGroups = useMemo(() => {
    if (user?.role === 'admin') return adminNavGroups;
    if (user?.role === 'mentor') return mentorNavGroups;
    if (user?.role === 'mentee') return menteeNavGroups;
    return [];
  }, [user?.role]);

  const isActive = (matches: string[]) => location.pathname.startsWith(matches[0]);

  const initials = useMemo(() => {
    if (!user) return 'AU';
    const first = user.firstname?.charAt(0) || '';
    const last = user.lastname?.charAt(0) || '';
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : (user.email?.charAt(0) || 'A').toUpperCase();
  }, [user]);

  const avatarUrl = useMemo(() => {
    return user?.profile?.photoUrl || user?.photoUrl || null;
  }, [user]);

  const homePath = useMemo(() => {
    switch (user?.role) {
      case 'admin': return '/admin/dashboard';
      case 'mentor': return '/mentor/dashboard';
      case 'mentee': return '/mentee/dashboard';
      default: return '/';
    }
  }, [user?.role]);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/profile')) return 'Profile';
    if (path.includes('/users')) return 'Users';
    if (path.includes('/applications')) return 'Applications';
    if (path.includes('/roster') || path.includes('/my-mentor')) return 'Mentorship';
    if (path.includes('/apply')) return 'Application';
    if (path.includes('/matching')) return 'Matching';
    if (path.includes('/sessions') || path.includes('/session') || path.includes('/chat')) return 'Sessions';
    if (path.includes('/materials')) return 'Materials';
    if (path.includes('/goals')) return 'Goals';
    if (path.includes('/feedback')) return 'Feedback';
    if (path.includes('/announcements')) return 'Announcements';
    if (path.includes('/recognition')) return 'Recognition';
    return 'Dashboard';
  }, [location.pathname]);

  return (
    <div className="tw-h-screen tw-w-screen tw-flex tw-overflow-hidden tw-bg-[var(--surface-background)] tw-text-[var(--text-primary)] tw-transition-colors tw-duration-200">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            {...{ className: "tw-fixed tw-inset-0 tw-bg-[var(--surface-overlay)] tw-backdrop-blur-sm tw-z-40 md:tw-hidden" } as any}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`
          tw-fixed md:tw-relative tw-inset-y-0 tw-left-0 tw-z-50 
          tw-w-[260px] tw-bg-[var(--surface-sidebar)] tw-border-r tw-border-[var(--border-color)]
          tw-transition-transform tw-duration-300 tw-ease-[cubic-bezier(0.34,1.56,0.64,1)]
          tw-flex tw-flex-col
          ${sidebarOpen ? 'tw-translate-x-0' : 'tw--translate-x-full md:tw-translate-x-0'}
          ${desktopSidebarCollapsed ? 'md:tw-w-0 md:tw-overflow-hidden md:tw-border-r-0' : ''}
        `}
      >
        <div className="tw-h-14 tw-flex tw-items-center tw-px-5 tw-flex-shrink-0 tw-border-b tw-border-[var(--border-color)]">
          <Link to={homePath} className="tw-text-[15px] tw-font-bold tw-tracking-tight tw-flex tw-items-center tw-gap-2">
            <div className="tw-w-6 tw-h-6 tw-bg-primary tw-rounded-md tw-flex tw-items-center tw-justify-center tw-text-white tw-shadow-sm">
              <span className="tw-text-xs">C</span>
            </div>
            <span className="tw-text-[var(--text-primary)]">ComSoc</span>
            <span className="tw-ml-1 tw-text-[11px] tw-font-medium tw-bg-[var(--surface-tertiary)] tw-text-[var(--text-secondary)] tw-px-1.5 tw-py-0.5 tw-rounded">
              {user?.role ? user.role.toUpperCase() : 'USER'}
            </span>
          </Link>
        </div>
        
        <nav className="tw-flex-1 tw-overflow-y-auto tw-px-3 tw-py-4 tw-space-y-6">
          {navGroups.map(group => (
            <div key={group.label}>
              <h3 className="tw-px-2 tw-text-[11px] tw-font-semibold tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider tw-mb-1.5">
                {group.label}
              </h3>
              <ul className="tw-space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item.matches);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          tw-flex tw-items-center tw-gap-3 tw-px-2.5 tw-py-1.5 tw-rounded-md tw-text-[13px] tw-font-medium tw-transition-all tw-duration-150
                          ${active 
                            ? 'tw-bg-[var(--surface-active)] tw-text-primary dark:tw-text-primary-400' 
                            : 'tw-text-[var(--text-secondary)] hover:tw-bg-[var(--surface-hover)] hover:tw-text-[var(--text-primary)]'
                          }
                        `}
                      >
                        <span className={`tw-opacity-80 ${active ? 'tw-opacity-100' : ''}`}>
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Container */}
      <div className="tw-flex-1 tw-flex tw-flex-col tw-min-w-0 tw-h-screen">
        {/* Header */}
        <header className="tw-h-14 tw-bg-[var(--surface-card)] tw-border-b tw-border-[var(--border-color)] tw-flex tw-items-center tw-justify-between tw-px-4 lg:tw-px-6 tw-flex-shrink-0 tw-z-30">
          <div className="tw-flex tw-items-center tw-gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setDesktopSidebarCollapsed(!desktopSidebarCollapsed);
                } else {
                  setSidebarOpen(true);
                }
              }}
              className="tw-p-1.5 tw-rounded-md tw-text-[var(--text-secondary)] hover:tw-bg-[var(--surface-hover)] hover:tw-text-[var(--text-primary)] tw-transition-colors"
            >
              <Icons.Menu />
            </button>
            <h1 className="tw-text-sm tw-font-semibold tw-text-[var(--text-primary)] tw-hidden sm:tw-block">
              {pageTitle}
            </h1>
          </div>

          <div className="tw-flex tw-items-center tw-gap-1 sm:tw-gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="tw-p-2 tw-rounded-md tw-text-[var(--text-secondary)] hover:tw-bg-[var(--surface-hover)] hover:tw-text-[var(--text-primary)] tw-transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
            </button>

            {/* Notifications */}
            <div className="tw-relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="tw-relative tw-p-2 tw-rounded-md tw-text-[var(--text-secondary)] hover:tw-bg-[var(--surface-hover)] hover:tw-text-[var(--text-primary)] tw-transition-colors"
              >
                <Icons.Bell />
                {unreadCount > 0 && (
                  <span className="tw-absolute tw-top-1.5 tw-right-1.5 tw-h-2 tw-w-2 tw-rounded-full tw-bg-red-500 tw-ring-2 tw-ring-[var(--surface-card)]" />
                )}
              </button>
              
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    {...{ className: "tw-absolute tw-right-0 tw-mt-2 tw-w-80 tw-bg-[var(--surface-card)] tw-rounded-xl tw-shadow-[var(--shadow-dropdown)] tw-border tw-border-[var(--border-color)] tw-py-1 tw-z-50 tw-overflow-hidden" } as any}
                  >
                      <div className="tw-px-4 tw-py-2.5 tw-border-b tw-border-[var(--border-color)] tw-flex tw-justify-between tw-items-center tw-bg-[var(--surface-secondary)]">
                        <span className="tw-text-[13px] tw-font-semibold tw-text-[var(--text-primary)]">Notifications</span>
                        <button 
                          onClick={() => markAllNotificationsRead()} 
                          className="tw-text-xs tw-font-medium tw-text-primary hover:tw-text-primary-600 disabled:tw-opacity-50"
                          disabled={isMarkingAll || unreadCount === 0}
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="tw-max-h-[300px] tw-overflow-y-auto">
                        {notificationsLoading || notificationsFetching ? (
                          <div className="tw-p-6 tw-text-center tw-text-sm tw-text-[var(--text-tertiary)]">Loading...</div>
                        ) : notifications.length === 0 ? (
                          <div className="tw-p-6 tw-text-center tw-text-sm tw-text-[var(--text-tertiary)]">No new notifications</div>
                        ) : (
                          notifications.map(n => (
                            <button
                              key={n.id}
                              onClick={() => markNotificationRead(n.id)}
                              className={`
                                tw-w-full tw-text-left tw-px-4 tw-py-3 tw-text-sm tw-transition-colors
                                hover:tw-bg-[var(--surface-hover)] tw-border-b tw-border-[var(--border-color)] last:tw-border-0
                                ${!n.readAt ? 'tw-bg-[var(--surface-active)]/30' : ''}
                              `}
                            >
                              <p className="tw-font-medium tw-text-[var(--text-primary)]">{n.title}</p>
                              <p className="tw-text-[13px] tw-text-[var(--text-secondary)] tw-mt-0.5 tw-line-clamp-2">{n.message}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="tw-relative tw-ml-2" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="tw-h-8 tw-w-8 tw-rounded-full tw-border tw-border-[var(--border-color)] tw-bg-[var(--surface-tertiary)] tw-flex tw-items-center tw-justify-center tw-overflow-hidden hover:tw-ring-2 hover:tw-ring-primary/20 tw-transition-all"
              >
                {avatarUrl && !imageError ? (
                  <img src={avatarUrl} alt="Avatar" className="tw-w-full tw-h-full tw-object-cover" onError={() => setImageError(true)} />
                ) : (
                  <span className="tw-text-xs tw-font-semibold tw-text-[var(--text-primary)]">{initials}</span>
                )}
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    {...{ className: "tw-absolute tw-right-0 tw-mt-2 tw-w-56 tw-bg-[var(--surface-card)] tw-rounded-xl tw-shadow-[var(--shadow-dropdown)] tw-border tw-border-[var(--border-color)] tw-py-1 tw-z-50" } as any}
                  >
                      <div className="tw-px-4 tw-py-3 tw-border-b tw-border-[var(--border-color)] tw-bg-[var(--surface-secondary)]">
                        <p className="tw-text-[13px] tw-font-semibold tw-text-[var(--text-primary)] tw-truncate">
                          {user?.firstname} {user?.lastname}
                        </p>
                        <p className="tw-text-xs tw-text-[var(--text-secondary)] tw-truncate">{user?.email}</p>
                      </div>
                      <div className="tw-py-1">
                        <button
                          onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                          className="tw-w-full tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-text-[13px] tw-font-medium tw-text-[var(--text-secondary)] hover:tw-text-[var(--text-primary)] hover:tw-bg-[var(--surface-hover)]"
                        >
                          <Icons.User /> Profile Settings
                        </button>
                      </div>
                      <div className="tw-border-t tw-border-[var(--border-color)] tw-py-1">
                        <button
                          onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            setDropdownOpen(false);
                            navigate('/login');
                          }}
                          className="tw-w-full tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-text-[13px] tw-font-medium tw-text-red-600 dark:tw-text-red-400 hover:tw-bg-red-50 dark:hover:tw-bg-red-950/30"
                        >
                          <Icons.LogOut /> Sign out
                        </button>
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="tw-flex-1 tw-overflow-y-auto tw-p-4 sm:tw-p-6 lg:tw-p-8 tw-bg-[var(--surface-background)]">
          <div className="tw-max-w-7xl tw-mx-auto tw-w-full tw-animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
