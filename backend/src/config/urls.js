const getClientOrigins = () => {
  const normalize = (value) => value.replace(/\/+$/, '');
  const fromClientUrls = (process.env.CLIENT_URLS || '')
    .split(',')
    .map((origin) => normalize(origin.trim()))
    .filter(Boolean);

  const fromClientUrl = normalize((process.env.CLIENT_URL || '').trim());
  const merged = [...fromClientUrls];
  if (fromClientUrl && !merged.includes(fromClientUrl)) {
    merged.push(fromClientUrl);
  }

  if (merged.length > 0) {
    return merged;
  }

  if (process.env.NODE_ENV !== 'production') {
    return ['http://localhost:5173'];
  }

  return [];
};

const getPrimaryClientUrl = () => {
  const origins = getClientOrigins();
  return origins[0] || null;
};

const getServerBaseUrl = () => {
  const explicitServerUrl = (process.env.SERVER_URL || '').trim();
  if (explicitServerUrl) {
    return explicitServerUrl;
  }

  const apiBaseUrl = (process.env.API_BASE_URL || '').trim();
  if (apiBaseUrl) {
    return apiBaseUrl.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV !== 'production') {
    return `http://localhost:${process.env.PORT || 4000}`;
  }

  return null;
};

module.exports = {
  getClientOrigins,
  getPrimaryClientUrl,
  getServerBaseUrl,
};
