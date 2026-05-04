import React from 'react';

const SubmitButton = ({ 
  loading = false, 
  children, 
  loadingText,
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`tw-w-full tw-h-9 tw-bg-primary tw-text-white tw-font-semibold tw-rounded-lg tw-hover:tw-bg-primary/90 tw-transition tw-disabled:tw-opacity-50 tw-disabled:tw-cursor-not-allowed tw-text-sm ${className}`}
      {...props}
    >
      {loading ? (loadingText || 'Loading...') : children}
    </button>
  );
};

export default SubmitButton;
