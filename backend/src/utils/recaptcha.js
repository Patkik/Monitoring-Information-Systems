const buildResponse = (overrides = {}) => ({
  ok: false,
  status: 400,
  code: 'RECAPTCHA_FAILED',
  message: 'reCAPTCHA verification failed.',
  details: [],
  ...overrides
});

const verifyRecaptchaToken = async (token, remoteIp) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    return buildResponse({
      status: 500,
      code: 'RECAPTCHA_NOT_CONFIGURED',
      message: 'reCAPTCHA secret key is not configured on the server.'
    });
  }

  if (!token) {
    return buildResponse({
      code: 'RECAPTCHA_REQUIRED',
      message: 'Please complete the reCAPTCHA verification.'
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: params
    });

    if (!response.ok) {
      return buildResponse({
        status: 502,
        code: 'RECAPTCHA_UPSTREAM_ERROR',
        message: 'Failed to validate reCAPTCHA response with Google.'
      });
    }

    const data = await response.json();
    if (data.success) {
      return { ok: true };
    }

    return buildResponse({
      code: 'RECAPTCHA_FAILED',
      message: 'reCAPTCHA verification did not succeed.',
      details: data['error-codes'] || []
    });
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return buildResponse({
      status: 500,
      code: 'RECAPTCHA_ERROR',
      message: 'Unable to verify reCAPTCHA at this time.'
    });
  }
};

module.exports = { verifyRecaptchaToken };
