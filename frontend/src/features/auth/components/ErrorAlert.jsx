import React from 'react';

const ErrorAlert = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div 
      className={`tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-3 ${className}`} 
      role="alert" 
      aria-live="polite"
    >
      <p className="tw-text-sm tw-text-red-700">{error}</p>
    </div>
  );
};

export default ErrorAlert;
