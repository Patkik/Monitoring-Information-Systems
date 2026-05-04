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

  const getToken = () => token;
  const isValid = () => !!token;

  return {
    token,
    ref,
    handleRecaptchaChange,
    resetRecaptcha,
    getToken,
    isValid
  };
};
