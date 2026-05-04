import { useState } from 'react';

export const useAuthForm = (initialValues) => {
  const [form, setForm] = useState(initialValues);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const setFormValues = (values) => {
    setForm(prev => ({ ...prev, ...values }));
  };

  const resetForm = () => {
    setForm(initialValues);
    setError('');
  };

  return {
    form,
    error,
    loading,
    setError,
    setLoading,
    handleChange,
    setFormValues,
    resetForm,
    setForm
  };
};
