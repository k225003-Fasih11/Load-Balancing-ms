import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
};

export const serverAPI = {
  getAll:       ()       => api.get('/servers'),
  create:       (data)   => api.post('/servers', data),
  update:       (id, d)  => api.put(`/servers/${id}`, d),
  delete:       (id)     => api.delete(`/servers/${id}`),
  getHealth:    ()       => api.get('/servers/health'),
  simulate:     (data)   => api.post('/servers/simulate', data),
};

export const analyticsAPI = {
  overview:    () => api.get('/analytics/overview'),
  comparison:  () => api.get('/analytics/comparison'),
  prediction:  () => api.get('/analytics/prediction'),
};

export const incidentAPI = {
  getAll:   ()   => api.get('/incidents'),
  resolve:  (id) => api.put(`/incidents/${id}/resolve`),
};

export const alertAPI = {
  getAll:  ()       => api.get('/alerts'),
  create:  (data)   => api.post('/alerts', data),
  update:  (id, d)  => api.put(`/alerts/${id}`, d),
  delete:  (id)     => api.delete(`/alerts/${id}`),
};

export const userAPI = {
  getAll:  ()       => api.get('/users'),
  update:  (id, d)  => api.put(`/users/${id}`, d),
  delete:  (id)     => api.delete(`/users/${id}`),
};

export const reportAPI   = { summary: () => api.get('/reports/summary') };
export const activityAPI = { getAll:  () => api.get('/activity') };
export const algoAPI     = {
  getAll:    ()       => api.get('/algorithms'),
  setActive: (algo)   => api.put('/algorithms/active', { algorithm: algo }),
};
export const settingsAPI = {
  updateNotifications: (d) => api.put('/settings/notifications', d),
  updateProfile:       (d) => api.put('/settings/profile', d),
};

export default api;
