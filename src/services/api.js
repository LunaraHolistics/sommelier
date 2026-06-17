import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

export const beveragesAPI = {
  getAll: () => api.get('/bebidas'),
  getById: (id) => api.get(`/bebidas/${id}`),
  create: (data) => api.post('/bebidas', data),
  update: (id, data) => api.put(`/bebidas/${id}`, data),
  delete: (id) => api.delete(`/bebidas/${id}`),
};

export const menuAPI = {
  getAll: () => api.get('/cardapio'),
  update: (data) => api.put('/cardapio', data),
};

export const pinAPI = {
  generate: () => api.post('/pin/gerar'),
  validate: (pin) => api.post('/pin/validar', { pin }),
};

export default api;