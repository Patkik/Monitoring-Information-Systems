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
          className="tw-block tw-mb-1 tw-text-[9px] tw-font-semibold tw-tracking-[0.12em] tw-uppercase tw-text-slate-500"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`tw-w-full tw-h-9 ${Icon ? 'tw-pl-9' : 'tw-pl-3'} tw-pr-3 tw-rounded-lg tw-border tw-bg-[#fbfcfd] focus:tw-bg-white focus:tw-outline-none tw-transition tw-text-sm ${
          error 
            ? 'tw-border-red-300 focus:tw-border-red-500 focus:tw-ring-3 focus:tw-ring-red-100' 
            : 'tw-border-gray-200 focus:tw-border-primary focus:tw-ring-3 focus:tw-ring-primary/15'
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
