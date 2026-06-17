import { createContext, useContext, useState, useEffect } from 'react';
import { beveragesAPI, menuAPI } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [bebidas, setBebidas] = useState([]);
  const [cardapio, setCardapio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState({ role: null, expiresAt: null });

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [bebidasRes, cardapioRes] = await Promise.all([
        beveragesAPI.getAll(),
        menuAPI.getAll()
      ]);
      setBebidas(bebidasRes.data);
      setCardapio(cardapioRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  // Sessão com expiração à meia-noite
  function setSession(role) {
    const agora = new Date();
    const meiaNoite = new Date(agora);
    meiaNoite.setHours(24, 0, 0, 0);
    
    const expiresAt = meiaNoite.toISOString();
    localStorage.setItem('vinhoSession', JSON.stringify({ role, expiresAt }));
    setAuth({ role, expiresAt });
  }

  function checkSession() {
    const session = localStorage.getItem('vinhoSession');
    if (!session) return null;
    
    const { role, expiresAt } = JSON.parse(session);
    if (new Date() > new Date(expiresAt)) {
      localStorage.removeItem('vinhoSession');
      return null;
    }
    return role;
  }

  function logout() {
    localStorage.removeItem('vinhoSession');
    setAuth({ role: null, expiresAt: null });
  }

  return (
    <AppContext.Provider value={{
      bebidas,
      cardapio,
      loading,
      auth,
      setSession,
      checkSession,
      logout,
      refreshData: loadData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);