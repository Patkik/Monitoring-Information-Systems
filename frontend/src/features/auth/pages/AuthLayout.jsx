import React from 'react';
import { Link } from 'react-router-dom';
import itcsLogo from './itcs-logo.png';
import './login-redesign.css';

export default function AuthLayout({ 
  title, 
  subtitle, 
  children,
  leftTopText = "Welcome to the CMIS Portal",
  stats = [
    { value: "12k+", label: "Students" },
    { value: "340+", label: "Courses" },
    { value: "98%", label: "Satisfaction" }
  ]
}) {

  // We map the incoming title/subtitle to the left Hero Title if provided,
  // or provide a default fallback so it looks great on all auth pages.
  const heroTitle = title ? title.split('\n').map((line, i, arr) => (
    <React.Fragment key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </React.Fragment>
  )) : (
    <>Sign in and<br />continue your momentum.</>
  );

  const heroSubtitle = subtitle || "Mentoring, progress tracking, and guided learning are waiting on the other side.";

  return (
    <div className="login-redesign tw-min-h-screen tw-flex tw-flex-col md:tw-grid md:tw-grid-cols-2 tw-bg-[#f7f8fa] tw-text-slate-900">
      <aside className="tw-hidden md:tw-flex md:tw-sticky md:tw-top-0 md:tw-h-screen md:tw-overflow-hidden tw-relative tw-flex-col tw-justify-between tw-p-8 lg:tw-p-10">
        <div className="login-redesign__mesh" aria-hidden="true" />
        <div className="login-redesign__grit" aria-hidden="true" />
        <div className="login-redesign__orbit" aria-hidden="true" />
        <div className="login-redesign__diamonds" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="tw-relative tw-z-10 tw-flex tw-items-center tw-gap-3 tw-animate-[fadeUp_.8s_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="tw-relative tw-h-12 tw-w-12 tw-rounded-full tw-bg-white/15 tw-backdrop-blur-md tw-ring-1 tw-ring-white/40 tw-flex tw-items-center tw-justify-center tw-overflow-hidden login-redesign__badge-ring">
            <img
              src={itcsLogo}
              alt="Information Technology Computer Society logo"
              className="tw-w-[72%] tw-h-[72%] tw-object-contain tw-drop-shadow-md login-redesign__badge-logo"
              loading="eager"
              decoding="async"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/logo.svg';
              }}
            />
          </div>
          <div>
            <p className="tw-text-[10px] tw-uppercase tw-tracking-[0.24em] tw-text-purple-200/80">CMIS Portal</p>
            <p className="tw-text-xs tw-tracking-[0.08em] tw-uppercase tw-text-white/70">Activate Project Access</p>
          </div>
        </div>

        <div className="tw-relative tw-z-10 tw-max-w-[28rem] tw-space-y-4">
          <p className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.24em] tw-text-purple-200/85">{leftTopText}</p>
          <h1 className="login-redesign__hero-title tw-leading-[0.95] tw-text-white">
            {heroTitle}
          </h1>
          <p className="tw-max-w-[28ch] tw-text-sm tw-leading-6 tw-text-purple-100/70">
            {heroSubtitle}
          </p>
          <div className="tw-h-[2px] tw-w-12 tw-bg-gradient-to-r tw-from-purple-300 tw-to-transparent" />
          {stats && stats.length > 0 && (
            <div className="tw-flex tw-gap-6 tw-pt-2">
              {stats.map((s, i) => (
                <div key={i}>
                  <p className="tw-text-2xl tw-font-semibold tw-text-white">{s.value}</p>
                  <p className="tw-mt-1 tw-text-[9px] tw-tracking-[0.14em] tw-uppercase tw-text-purple-200/70">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="tw-relative tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-screen tw-py-8 tw-px-4 sm:tw-px-6 tw-bg-white tw-overflow-y-auto">
        <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-h-[2px] tw-bg-gradient-to-r tw-from-primary tw-via-purple-400 tw-to-transparent" aria-hidden="true" />

        <div className="tw-w-full tw-max-w-md tw-rounded-2xl tw-bg-white tw-border tw-border-purple-100 tw-shadow-[0_12px_40px_rgba(91,22,163,0.08)] tw-p-6 sm:tw-p-8">
          <Link
            to="/"
            className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-text-slate-500 hover:tw-text-primary tw-transition-colors"
          >
            <span aria-hidden="true">&larr;</span>
            <span className="tw-hidden sm:tw-inline">Return to landing page</span>
            <span className="sm:tw-hidden">Back</span>
          </Link>

          <div className="tw-w-full tw-mt-4">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}


