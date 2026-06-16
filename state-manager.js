/**
 * StateManager - Camada central de gerenciamento de estado
 * Responsável por:
 * - Carregar todos os dados (catalogo, db, cardapio)
 * - Manter APP_STATE em memória
 * - Sincronizar entre abas via BroadcastChannel
 * - Persistir alterações no backend
 * - Fornecer dados limpos e normalizados para todas as telas
 */

class StateManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3000/api';
        this.channelName = 'vinho_em_maos_sync';
        this.channel = null;
        
        // Estado central da aplicação
        this.APP_STATE = {
            catalogo: [],
            bebidas: [],
            cardapio: [],
            pinDiario: null,
            lastUpdate: null
        };

        // Callbacks para notificação de mudanças
        this.listeners = [];

        // Inicializar
        this.init();
    }

    /**
     * Inicializa o StateManager
     */
    async init() {
        // Configurar BroadcastChannel
        this.setupBroadcastChannel();
        
        // Carregar dados iniciais
        await this.loadAllData();
        
        console.log('✅ StateManager inicializado');
    }

    /**
     * Configura BroadcastChannel para sincronização entre abas
     */
    setupBroadcastChannel() {
        if ('BroadcastChannel' in window) {
            this.channel = new BroadcastChannel(this.channelName);
            this.channel.onmessage = (event) => {
                if (event.data.type === 'STATE_UPDATED') {
                    console.log('🔄 Sincronização recebida de outra aba');
                    this.loadAllData().then(() => {
                        this.notifyListeners();
                    });
                }
            };
        }

        // Fallback para localStorage
        window.addEventListener('storage', (event) => {
            if (event.key === 'vinho_state_update') {
                console.log(' Sincronização via localStorage');
                this.loadAllData().then(() => {
                    this.notifyListeners();
                });
            }
        });
    }

    /**
     * Carrega todos os dados do backend
     */
    async loadAllData() {
        try {
            const [catalogo, bebidas, cardapio, pin] = await Promise.all([
                this.fetchData('/catalogo.json'),
                this.fetchData('/api/bebidas'),
                this.fetchData('/api/cardapio'),
                this.fetchData('/api/pin/validar', 'GET', null, true) // ignora erro
            ]);

            // Normalizar dados (remover espaços)
            this.APP_STATE.catalogo = this.cleanArray(catalogo);
            this.APP_STATE.bebidas = this.cleanArray(bebidas);
            this.APP_STATE.cardapio = Array.isArray(cardapio) ? this.cleanArray(cardapio) : [];
            this.APP_STATE.pinDiario = pin && !pin.error ? pin : null;
            this.APP_STATE.lastUpdate = new Date().toISOString();

            console.log('📦 Dados carregados:', {
                catalogo: this.APP_STATE.catalogo.length,
                bebidas: this.APP_STATE.bebidas.length,
                cardapio: this.APP_STATE.cardapio.length
            });

            return this.APP_STATE;
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            throw error;
        }
    }

    /**
     * Fetch com tratamento de erro e limpeza
     */
    async fetchData(url, method = 'GET', data = null, ignoreError = false) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(this.API_BASE_URL + url, options);
            const text = await response.text();
            
            let json;
            try {
                json = JSON.parse(text);
            } catch (parseError) {
                console.error('Erro ao parsear JSON:', parseError);
                return ignoreError ? null : { error: true, message: 'Resposta inválida' };
            }

            if (!response.ok && !ignoreError) {
                throw new Error(`HTTP ${response.status}`);
            }

            return json;
        } catch (error) {
            if (ignoreError) return null;
            console.error('Erro na requisição:', error);
            return { error: true, message: error.message };
        }
    }

    /**
     * Limpa espaços de chaves e valores
     */
    cleanObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            const cleanKey = key.trim();
            if (typeof value === 'string') {
                cleaned[cleanKey] = value.trim();
            } else if (Array.isArray(value)) {
                cleaned[cleanKey] = value.map(v => typeof v === 'string' ? v.trim() : v);
            } else {
                cleaned[cleanKey] = value;
            }
        }
        return cleaned;
    }

    cleanArray(arr) {
        if (!Array.isArray(arr)) return arr;
        return arr.map(item => this.cleanObject(item));
    }

    /**
     * Merge entre catalogo.json e db.json
     * Retorna lista completa com informações de estoque/preço
     */
    getBebidasCompletas() {
        return this.APP_STATE.catalogo.map(itemCatalogo => {
            const itemDB = this.APP_STATE.bebidas.find(
                b => b.nome.toLowerCase() === itemCatalogo.nome.toLowerCase()
            );

            if (itemDB) {
                return {
                    ...itemCatalogo,
                    id: itemDB.id,
                    disponivel: itemDB.disponivel,
                    estoque: itemDB.estoque,
                    preco: itemDB.preco
                };
            } else {
                return {
                    ...itemCatalogo,
                    id: null,
                    disponivel: false,
                    estoque: 0,
                    preco: 0
                };
            }
        });
    }

    /**
     * Ativa uma bebida no restaurante
     */
    async ativarBebida(nomeBebida, dados) {
        try {
            // Verificar se já existe
            const existente = this.APP_STATE.bebidas.find(
                b => b.nome.toLowerCase() === nomeBebida.toLowerCase()
            );

            let resultado;
            
            if (existente) {
                // UPDATE
                resultado = await this.fetchData(
                    `/api/bebidas/${existente.id}`,
                    'PUT',
                    { ...existente, ...dados, nome: nomeBebida }
                );
            } else {
                // CREATE - gerar novo ID
                const novoId = this.APP_STATE.bebidas.length > 0 
                    ? Math.max(...this.APP_STATE.bebidas.map(b => b.id)) + 1 
                    : 1;
                
                resultado = await this.fetchData(
                    `/api/bebidas/${novoId}`,
                    'PUT',
                    { id: novoId, nome: nomeBebida, ...dados, disponivel: true }
                );
            }

            if (resultado && !resultado.error) {
                // Recarregar dados
                await this.loadAllData();
                
                // Notificar outras abas
                this.notifyOtherTabs();
                
                // Notificar listeners locais
                this.notifyListeners();
                
                console.log('✅ Bebida ativada:', nomeBebida);
                return resultado;
            } else {
                throw new Error(resultado?.message || 'Erro ao ativar bebida');
            }
        } catch (error) {
            console.error('❌ Erro ao ativar bebida:', error);
            throw error;
        }
    }

    /**
     * Atualiza estoque de uma bebida
     */
    async atualizarEstoque(id, dados) {
        try {
            const resultado = await this.fetchData(
                `/api/bebidas/${id}`,
                'PUT',
                dados
            );

            if (resultado && !resultado.error) {
                await this.loadAllData();
                this.notifyOtherTabs();
                this.notifyListeners();
                console.log('✅ Estoque atualizado:', id);
                return resultado;
            } else {
                throw new Error(resultado?.message || 'Erro ao atualizar');
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar estoque:', error);
            throw error;
        }
    }

    /**
     * Atualiza cardápio
     */
    async atualizarCardapio(novoCardapio) {
        try {
            const resultado = await this.fetchData(
                '/api/cardapio',
                'PUT',
                novoCardapio
            );

            if (resultado && !resultado.error) {
                await this.loadAllData();
                this.notifyOtherTabs();
                this.notifyListeners();
                console.log('✅ Cardápio atualizado');
                return resultado;
            } else {
                throw new Error(resultado?.message || 'Erro ao atualizar cardápio');
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar cardápio:', error);
            throw error;
        }
    }

    /**
     * Gera novo PIN
     */
    async gerarPIN() {
        try {
            const resultado = await this.fetchData(
                '/api/pin/gerar',
                'POST'
            );

            if (resultado && !resultado.error) {
                this.APP_STATE.pinDiario = resultado;
                this.notifyListeners();
                console.log('✅ PIN gerado:', resultado.pin);
                return resultado;
            } else {
                throw new Error(resultado?.message || 'Erro ao gerar PIN');
            }
        } catch (error) {
            console.error('❌ Erro ao gerar PIN:', error);
            throw error;
        }
    }

    /**
     * Valida PIN
     */
    async validarPIN(pin) {
        try {
            const resultado = await this.fetchData(
                '/api/pin/validar',
                'POST',
                { pin }
            );

            return resultado;
        } catch (error) {
            console.error('❌ Erro ao validar PIN:', error);
            return { valid: false, message: error.message };
        }
    }

    /**
     * Notifica outras abas via BroadcastChannel
     */
    notifyOtherTabs() {
        // BroadcastChannel
        if (this.channel) {
            this.channel.postMessage({
                type: 'STATE_UPDATED',
                timestamp: Date.now()
            });
        }

        // Fallback localStorage
        localStorage.setItem('vinho_state_update', Date.now().toString());
    }

    /**
     * Adiciona listener para mudanças de estado
     */
    onChange(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove listener
     */
    offChange(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    /**
     * Notifica todos os listeners locais
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.APP_STATE);
            } catch (error) {
                console.error('Erro no listener:', error);
            }
        });
    }

    /**
     * Getters para acesso seguro aos dados
     */
    getCatalogo() {
        return [...this.APP_STATE.catalogo];
    }

    getBebidas() {
        return [...this.APP_STATE.bebidas];
    }

    getCardapio() {
        return [...this.APP_STATE.cardapio];
    }

    getPinDiario() {
        return this.APP_STATE.pinDiario;
    }

    getState() {
        return { ...this.APP_STATE };
    }
}

// Exportar para uso global
window.StateManager = StateManager;