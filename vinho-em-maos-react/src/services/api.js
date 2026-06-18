const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.adminToken = localStorage.getItem('adminToken') || '';
  }

  setAdminToken(token) {
    this.adminToken = token;
    localStorage.setItem('adminToken', token);
  }

  clearAdminToken() {
    this.adminToken = '';
    localStorage.removeItem('adminToken');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.adminToken && { 'x-admin-token': this.adminToken })
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ─── Catálogo ───────────────────────────────────────────
  async getCatalogo(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return this.request(`/catalogo?${params.toString()}`);
  }

  async getCatalogoItem(id) {
    return this.request(`/catalogo/${id}`);
  }

  async updateCatalogoItem(id, data) {
    return this.request(`/catalogo/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // ─── PIN ─────────────────────────────────────────────────
  async generatePin() {
    return this.request('/pin', { method: 'POST' });
  }

  async getPin() {
    return this.request('/pin');
  }

  async validatePin(code) {
    return this.request('/pin/validate', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  // ─── Auth ────────────────────────────────────────────────
  async loginManager(password) {
    const response = await this.request('/auth/manager', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    if (response.ok) {
      this.setAdminToken(password);
    }
    return response;
  }

  // ─── Cardápio ────────────────────────────────────────────
  async getCardapio(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/cardapio?${params.toString()}`);
  }

  // ─── Harmonização ────────────────────────────────────────
  async harmonize(pratoId) {
    return this.request('/harmonize', {
      method: 'POST',
      body: JSON.stringify({ pratoId })
    });
  }

  async harmonizeByTags(tags) {
    return this.request('/harmonize', {
      method: 'POST',
      body: JSON.stringify({ tags })
    });
  }

  // ─── Stats ───────────────────────────────────────────────
  async getStats() {
    return this.request('/stats');
  }

  async getStatus() {
    return this.request('/status');
  }
}

export const api = new ApiService();
export default api;