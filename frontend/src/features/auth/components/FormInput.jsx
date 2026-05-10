import React from 'react';

const FormInput = React.forwardRef(({ 
  label, 
  placeholder, 
  name, 
  type = 'text', 
  value, 
  onChange,
  required = false,
  icon: Icon,
  error,
  id,
  ...props 
}, ref) => {
  return (
    <div className="tw-relative">
      {Icon && (
        <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
          {typeof Icon === 'function' ? <Icon /> : Icon}
        </div>
      )}
      {label && (
        <label 
          htmlFor={id} 
          className="tw-block tw-mb-1 tw-text-[9px] tw-font-semibold tw-tracking-[0.12em] tw-uppercase tw-text-slate-500 dark:tw-text-slate-400"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`tw-w-full tw-h-9 ${Icon ? 'tw-pl-9' : 'tw-pl-3'} tw-pr-3 tw-rounded-lg tw-border tw-bg-[#fbfcfd] dark:tw-bg-[#151226] focus:tw-bg-white dark:focus:tw-bg-[#1e1a34] focus:tw-outline-none tw-transition tw-text-sm tw-text-gray-900 dark:tw-text-white placeholder:tw-text-gray-400 dark:placeholder:tw-text-slate-500 ${
          error 
            ? 'tw-border-red-400 dark:tw-border-red-500/50 focus:tw-border-red-500 focus:tw-ring-3 focus:tw-ring-red-100 dark:focus:tw-ring-red-500/20' 
            : 'tw-border-gray-300 dark:tw-border-white/10 focus:tw-border-primary dark:focus:tw-border-purple-400 focus:tw-ring-3 focus:tw-ring-primary/15 dark:focus:tw-ring-purple-400/20'
        }`}
        placeholder={placeholder}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
      {error && (
        <p className="tw-text-xs tw-text-red-600 tw-mt-1">{error}</p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
