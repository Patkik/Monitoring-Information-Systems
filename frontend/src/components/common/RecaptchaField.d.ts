import React from 'react';

export interface RecaptchaFieldProps {
  onChange: (token: string | null) => void;
  onExpired: () => void;
}

declare const RecaptchaField: React.ForwardRefExoticComponent<RecaptchaFieldProps & React.RefAttributes<any>>;
export default RecaptchaField;
