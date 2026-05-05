import React, { forwardRef, useEffect } from 'react';

// ── reCAPTCHA disabled mode ────────────────────────────────────────────────
// When VITE_RECAPTCHA_DISABLED is 'true', this component renders nothing and
// immediately fires onChange with a bypass token so forms submit normally.
const DISABLED = import.meta.env.VITE_RECAPTCHA_DISABLED === 'true';

const MODE = import.meta.env.MODE;
const DEV_TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
const resolvedSiteKey =
    import.meta.env.VITE_RECAPTCHA_SITE_KEY || (MODE !== 'production' ? DEV_TEST_SITE_KEY : '');

const RecaptchaField = forwardRef(({ onChange, onExpired, className = '' }, ref) => {
  // Disabled mode: expose a no-op reset handle and auto-fire a bypass token
  useEffect(() => {
    if (DISABLED && onChange) {
      onChange('recaptcha-disabled-bypass');
    }
  }, [onChange]);

  // Expose a reset() handle for parent refs even in disabled mode
  React.useImperativeHandle(ref, () => ({
    reset: () => {
      if (DISABLED && onChange) onChange('recaptcha-disabled-bypass');
    }
  }));

  if (DISABLED) {
    // Render nothing — the token is set via useEffect above
    return null;
  }

  if (!resolvedSiteKey) {
    return (
      <div
        className={`tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700 ${className}`}
        role="alert"
        aria-live="polite"
      >
        reCAPTCHA is not configured. Please set the VITE_RECAPTCHA_SITE_KEY environment variable.
      </div>
    );
  }

  // Lazy-import the real widget only when not disabled (avoids loading Google scripts)
  const ReCAPTCHA = React.lazy(() => import('react-google-recaptcha'));

  return (
    <div className={`tw-flex tw-flex-col tw-items-center ${className}`}>
      {resolvedSiteKey === DEV_TEST_SITE_KEY && (
        <p className="tw-mb-2 tw-text-xs tw-text-amber-700 tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded tw-px-2 tw-py-1" aria-live="polite">
          Using Google reCAPTCHA test key (dev only). Complete the widget to proceed.
        </p>
      )}
      <React.Suspense fallback={<div className="tw-h-20 tw-w-full tw-animate-pulse tw-rounded tw-bg-gray-100" />}>
        <ReCAPTCHA ref={ref} sitekey={resolvedSiteKey} onChange={onChange} onExpired={onExpired} theme="light" />
      </React.Suspense>
    </div>
  );
});

RecaptchaField.displayName = 'RecaptchaField';

export default RecaptchaField;
