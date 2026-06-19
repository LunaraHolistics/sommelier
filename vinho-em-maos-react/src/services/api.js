const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.adminToken = localStorage.getItem('adminToken') || '';
    this.timeout = 30000; // 30 segundos
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

    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Resposta inválida do servidor: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        // Erros específicos de autenticação
        if (response.status === 401) {
          this.clearAdminToken();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Tratamento específico para diferentes tipos de erro
      if (error.name === 'AbortError') {
        console.error(`Timeout [${endpoint}]: Requisição demorou mais de ${this.timeout/1000}s`);
        throw new Error('Tempo de resposta excedido. Tente novamente.');
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error(`Network Error [${endpoint}]:`, error);
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }

      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

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

  async getCardapio(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return this.request(`/cardapio?${params.toString()}`);
  }

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

  async getStats() {
    return this.request('/stats');
  }

  async getStatus() {
    return this.request('/status');
  }

  // Método para criar cardápio (CRUD)
  async createCardapio(dishData) {
    return this.request('/cardapio', {
      method: 'POST',
      body: JSON.stringify(dishData)
    });
  }

  // Método para atualizar cardápio (CRUD)
  async updateCardapio(id, dishData) {
    return this.request(`/cardapio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dishData)
    });
  }

  // Método para deletar cardápio (CRUD)
  async deleteCardapio(id) {
    return this.request(`/cardapio/${id}`, {
      method: 'DELETE'
    });
  }

  // Método para atualizar status do cardápio
  async updateCardapioStatus(id, status) {
    return this.request(`/cardapio/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Método para obter tags
  async getTags() {
    return this.request('/tags');
  }
}

export const api = new ApiService();
export default api;