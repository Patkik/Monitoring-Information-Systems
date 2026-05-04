import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useNotifications from '../../shared/hooks/useNotifications';
import logger from '../../shared/utils/logger';

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

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSummary | null>(() => getStoredUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Notification and Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

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
    if (!dropdownOpen && !notifOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, notifOpen]);

  // Sidebar link groups
  const navGroups = [
    {
      label: 'System',
      items: [
        { label: 'Dashboard', to: '/admin/dashboard', matches: ['/admin/dashboard'] }
      ]
    },
    {
      label: 'People',
      items: [
        { label: 'Users', to: '/admin/users', matches: ['/admin/users'] },
        { label: 'Applications', to: '/admin/applications', matches: ['/admin/applications'] }
      ]
    },
    {
      label: 'Operations',
      items: [
        { label: 'Matching', to: '/admin/matching', matches: ['/admin/matching'] },
        { label: 'Sessions', to: '/admin/sessions', matches: ['/admin/sessions'] }
      ]
    },
    {
      label: 'Activity',
      items: [
        { label: 'Feedback', to: '/admin/feedback', matches: ['/admin/feedback'] },
        { label: 'Announcements', to: '/admin/announcements', matches: ['/admin/announcements'] },
        { label: 'Recognition', to: '/admin/recognition', matches: ['/admin/recognition'] }
      ]
    }
  ];

  const isActive = (matches: string[]) => {
    return matches.some(path => location.pathname.startsWith(path));
  };

  const initials = useMemo(() => {
    if (!user) return 'AU';
    const first = user.firstname?.charAt(0) || '';
    const last = user.lastname?.charAt(0) || '';
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : (user.email?.charAt(0) || 'A').toUpperCase();
  }, [user]);

  const avatarUrl = useMemo(() => {
    const profilePhoto = typeof user?.profile === 'object' ? user?.profile?.photoUrl : undefined;
    return profilePhoto || user?.photoUrl || null;
  }, [user?.profile, user?.photoUrl]);

  // Compute Page Title from location
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'Users';
    if (path.includes('/admin/applications')) return 'Applications';
    if (path.includes('/admin/matching')) return 'Matching';
    if (path.includes('/admin/sessions')) return 'Sessions';
    if (path.includes('/admin/feedback')) return 'Feedback';
    if (path.includes('/admin/announcements')) return 'Announcements';
    if (path.includes('/admin/recognition')) return 'Recognition';
    return 'Admin Dashboard';
  }, [location.pathname]);

  return (
    <div className="tw-h-screen tw-w-screen tw-overflow-hidden tw-bg-[#F4F5F7] tw-grid md:tw-grid-cols-[260px_1fr] tw-grid-rows-[64px_1fr] lg:tw-grid-cols-[280px_1fr]">
      
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-40 md:tw-hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`tw-fixed md:tw-static tw-top-0 tw-bottom-0 tw-left-0 tw-z-50 tw-w-[260px] lg:tw-w-[280px] tw-bg-white tw-shadow-[1px_0_0_0_rgba(0,0,0,0.05)] tw-transition-transform tw-duration-300 tw-ease-in-out md:tw-translate-x-0 tw-row-span-2 tw-flex tw-flex-col ${sidebarOpen ? 'tw-translate-x-0' : 'tw--translate-x-full'}`}
      >
        <div className="tw-h-16 tw-flex tw-items-center tw-px-6 tw-flex-shrink-0">
          <Link to="/admin/dashboard" className="tw-text-xl tw-font-bold tw-text-primary">
            ComSoc <span className="tw-text-sm tw-text-gray-500 tw-font-normal">Admin</span>
          </Link>
        </div>
        
        <nav className="tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-6 tw-space-y-8">
          {navGroups.map(group => (
            <div key={group.label}>
              <h3 className="tw-px-3 tw-text-[11px] tw-font-semibold tw-text-gray-400 tw-uppercase tw-tracking-wider tw-mb-2">
                {group.label}
              </h3>
              <ul className="tw-space-y-1">
                {group.items.map(item => {
                  const active = isActive(item.matches);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`tw-flex tw-items-center tw-px-3 tw-py-2 tw-rounded-md tw-text-sm tw-font-medium tw-transition-colors ${
                          active 
                            ? 'tw-bg-purple-50 tw-text-primary tw-border-l-4 tw-border-primary' 
                            : 'tw-text-gray-600 hover:tw-bg-gray-100 tw-border-l-4 tw-border-transparent'
                        }`}
                      >
                        <span className={active ? 'tw-ml-[-4px]' : ''}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Top Header */}
      <header className="tw-bg-white tw-shadow-[0_1px_0_0_rgba(0,0,0,0.05)] tw-flex tw-items-center tw-justify-between tw-px-4 sm:tw-px-6 tw-col-start-1 md:tw-col-start-2 tw-row-start-1 tw-z-30">
        <div className="tw-flex tw-items-center tw-gap-4">
          <button
            type="button"
            className="md:tw-hidden tw-p-2 tw-rounded-md tw-text-gray-500 hover:tw-bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open admin navigation"
            title="Open admin navigation"
          >
            <span className="tw-sr-only">Open admin navigation</span>
            <svg className="tw-w-5 tw-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="tw-text-lg tw-font-semibold tw-text-gray-900">{pageTitle}</h1>
        </div>

        <div className="tw-flex tw-items-center tw-gap-4">
          {/* Notifications */}
          <div className="tw-relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="tw-relative tw-p-2 tw-text-gray-500 hover:tw-text-gray-700 tw-rounded-full hover:tw-bg-gray-100 tw-transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              title="Notifications"
            >
              <span className="tw-sr-only">Notifications</span>
              <svg className="tw-w-5 tw-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="tw-absolute tw-top-1.5 tw-right-1.5 tw-block tw-h-2 tw-w-2 tw-rounded-full tw-bg-red-500 tw-ring-2 tw-ring-white" />
              )}
            </button>
            {/* Notification Dropdown (simplified for layout) */}
            {notifOpen && (
              <div className="tw-absolute tw-right-0 tw-mt-2 tw-w-80 tw-bg-white tw-rounded-lg tw-shadow-lg tw-border tw-border-gray-100 tw-py-2 tw-z-50">
                <div className="tw-px-4 tw-py-2 tw-border-b tw-border-gray-100 tw-flex tw-justify-between tw-items-center">
                  <span className="tw-text-sm tw-font-semibold tw-text-gray-900">Notifications</span>
                  <button 
                    onClick={() => markAllNotificationsRead()} 
                    className="tw-text-xs tw-text-primary hover:tw-text-purple-700"
                    disabled={isMarkingAll || unreadCount === 0}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="tw-max-h-64 tw-overflow-y-auto">
                  {notificationsLoading || notificationsFetching ? (
                    <div className="tw-p-4 tw-text-center tw-text-sm tw-text-gray-500">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="tw-p-4 tw-text-center tw-text-sm tw-text-gray-500">No new notifications.</div>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`tw-w-full tw-text-left tw-px-4 tw-py-3 tw-text-sm hover:tw-bg-gray-50 tw-border-b tw-border-gray-50 last:tw-border-0 ${!n.readAt ? 'tw-bg-purple-50/50' : ''}`}
                      >
                        <p className="tw-font-medium tw-text-gray-900">{n.title}</p>
                        <p className="tw-text-xs tw-text-gray-500 tw-mt-1">{n.message}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="tw-relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="tw-flex tw-items-center tw-gap-2 tw-p-1 tw-rounded-full hover:tw-bg-gray-100 tw-transition-colors"
              aria-label="Open profile menu"
              title="Open profile menu"
            >
              <span className="tw-sr-only">Open profile menu</span>
              <div className="tw-h-8 tw-w-8 tw-rounded-full tw-bg-primary tw-text-white tw-flex tw-items-center tw-justify-center tw-text-sm tw-font-semibold tw-overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="tw-w-full tw-h-full tw-object-cover" />
                ) : initials}
              </div>
            </button>
            {dropdownOpen && (
              <div className="tw-absolute tw-right-0 tw-mt-2 tw-w-48 tw-bg-white tw-rounded-lg tw-shadow-lg tw-border tw-border-gray-100 tw-py-1 tw-z-50">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="tw-w-full tw-text-left tw-px-4 tw-py-2 tw-text-sm tw-text-gray-700 hover:tw-bg-gray-50"
                >
                  Your Profile
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setDropdownOpen(false);
                    navigate('/login');
                  }}
                  className="tw-w-full tw-text-left tw-px-4 tw-py-2 tw-text-sm tw-text-red-600 hover:tw-bg-red-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="tw-col-start-1 md:tw-col-start-2 tw-row-start-2 tw-overflow-y-auto tw-p-4 sm:tw-p-6 md:tw-p-8">
        <div className="tw-max-w-7xl tw-mx-auto tw-w-full">
          {children}
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;
