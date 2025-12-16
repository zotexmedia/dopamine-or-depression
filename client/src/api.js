// API Client for ETL Dashboard

const API_BASE = '/api';

// Get auth token from localStorage
function getToken() {
  return localStorage.getItem('etl_admin_token');
}

// Set auth token in localStorage
export function setToken(token) {
  if (token) {
    localStorage.setItem('etl_admin_token', token);
  } else {
    localStorage.removeItem('etl_admin_token');
  }
}

// Generic fetch wrapper
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

// API methods
export const api = {
  // Metrics (public)
  getMetrics: () => request('/metrics'),
  getMetricsForDate: (date) => request(`/metrics/date/${date}`),
  getMetricsForRange: (startDate, endDate) => request(`/metrics/range?start=${startDate}&end=${endDate}`),
  refreshMetrics: () => request('/metrics/refresh', { method: 'POST' }),
  checkHealth: () => request('/metrics/health'),

  // Auth
  login: (password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  verifyToken: () => request('/auth/verify'),

  // Leads (admin only)
  submitLeads: (leadCount, date, notes) => request('/leads', {
    method: 'POST',
    body: JSON.stringify({ leadCount, date, notes })
  }),
  getRecentEntries: (days = 7) => request(`/leads/recent?days=${days}`),

  // Industries
  getIndustries: () => request('/industries'),
  getIndustryLeads: (startDate, endDate, source) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (source) params.append('source', source);
    return request(`/industries/leads?${params}`);
  },
  getIndustryLeaderboard: (startDate, endDate, source, limit = 20) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (source) params.append('source', source);
    params.append('limit', limit);
    return request(`/industries/leaderboard?${params}`);
  },
  submitIndustryLeads: (industryId, date, leadsCount, source = 'apollo', notes) => request('/industries/leads', {
    method: 'POST',
    body: JSON.stringify({ industryId, date, leadsCount, source, notes })
  }),
  getIndustryStats: (id, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return request(`/industries/${id}/stats?${params}`);
  }
};

export default api;
