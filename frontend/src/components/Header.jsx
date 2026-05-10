import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../shared/contexts/ThemeContext';

export default function Header() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const isActive = (path) => {
    return location.pathname === path
      ? 'tw-text-purple-600 dark:tw-text-purple-400 tw-font-semibold'
      : 'tw-text-gray-600 dark:tw-text-gray-300 hover:tw-text-purple-600 dark:hover:tw-text-purple-400 tw-transition-colors';
  };

  return (
    <header className="tw-px-6 tw-py-4 tw-flex tw-items-center tw-justify-between tw-bg-white/80 dark:tw-bg-[#0B0914]/80 tw-backdrop-blur-xl tw-shadow-sm dark:tw-shadow-[0_4px_20px_rgba(0,0,0,0.5)] tw-sticky tw-top-0 tw-z-50 tw-border-b tw-border-gray-100 dark:tw-border-white/10 tw-transition-colors tw-duration-300">
      <div className="tw-flex tw-items-center tw-gap-8">
        <Link to="/" className="tw-inline-flex tw-items-center tw-gap-3 tw-group">
          <div className="tw-relative">
            <div className="tw-absolute tw-inset-0 tw-bg-purple-500 tw-rounded-xl tw-blur-md tw-opacity-0 group-hover:tw-opacity-50 tw-transition-opacity" />
            <img src="/logo.svg" alt="ComSoc Mentoring logo" className="tw-relative tw-h-10 tw-w-10 tw-rounded-xl tw-shadow-sm tw-bg-white dark:tw-bg-transparent" />
          </div>
          <span className="tw-text-xl tw-font-extrabold tw-text-gray-900 dark:tw-text-white tw-tracking-tight group-hover:tw-text-purple-600 dark:group-hover:tw-text-purple-400 tw-transition-colors">
            ComSoc
          </span>
        </Link>
        <nav className="tw-hidden lg:tw-flex tw-items-center tw-gap-6 tw-text-sm">
          <Link to="/about" className={isActive('/about')}>About</Link>
          <Link to="/how-it-works" className={isActive('/how-it-works')}>How it works</Link>
          <Link to="/features" className={isActive('/features')}>Features</Link>
          <Link to="/contact" className={isActive('/contact')}>Contact</Link>
        </nav>
      </div>
      <div className="tw-flex tw-items-center tw-gap-4">
        <button
          onClick={toggleTheme}
          className="tw-p-2 tw-rounded-full tw-text-gray-500 dark:tw-text-gray-400 hover:tw-bg-gray-100 dark:hover:tw-bg-white/10 tw-transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? (
            <svg className="tw-w-5 tw-h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="tw-w-5 tw-h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <div className="tw-h-6 tw-w-px tw-bg-gray-200 dark:tw-bg-white/10 tw-hidden sm:tw-block" />
        <Link
          to="/register"
          className="tw-hidden sm:tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-semibold tw-text-gray-700 dark:tw-text-gray-300 hover:tw-bg-gray-50 dark:hover:tw-bg-white/5 tw-transition-colors"
        >
          Sign up
        </Link>
        <Link
          to="/login"
          className="tw-inline-flex tw-items-center tw-justify-center tw-px-5 tw-py-2 tw-rounded-lg tw-bg-purple-600 tw-text-white tw-text-sm tw-font-bold hover:tw-bg-purple-500 hover:tw-shadow-[0_0_15px_rgba(168,85,247,0.4)] tw-transition-all"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
