import { useState, useRef } from 'react';

export const useRecaptcha = () => {
  const [token, setToken] = useState('');
  const ref = useRef();

  const handleRecaptchaChange = (newToken) => {
    setToken(newToken);
  };

  const resetRecaptcha = () => {
    ref.current?.reset?.();
    setToken('');
  };

  const isDevMode = import.meta.env.DEV || (import.meta.env.VITE_ENVIRONMENT || '').includes('development');

  const getToken = () => (isDevMode ? 'dev-bypass' : token);
  const isValid = () => isDevMode || !!token;

  return {
    token,
    ref,
    handleRecaptchaChange,
    resetRecaptcha,
    getToken,
    isValid
  };
};
