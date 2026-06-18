import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [catalogo, setCatalogo] = useState([]);
  const [cardapio, setCardapio] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [catalogoRes, cardapioRes] = await Promise.all([
        api.getCatalogo(),
        api.getCardapio()
      ]);
      setCatalogo(catalogoRes.items || []);
      setCardapio(cardapioRes || []);
    } catch (err) {
      setError('Falha ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loginAsManager = async (password) => {
    try {
      const response = await api.loginManager(password);
      if (response.ok) {
        setUserRole('manager');
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro no login:', err);
      return false;
    }
  };

  const loginAsSommelier = async (pinCode) => {
    try {
      const response = await api.validatePin(pinCode);
      if (response.valid) {
        setUserRole('sommelier');
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro na validação do PIN:', err);
      return false;
    }
  };

  const logout = () => {
    setUserRole(null);
    setIsAuthenticated(false);
    api.clearAdminToken();
  };

  const updateCatalogoItem = async (id, data) => {
    try {
      await api.updateCatalogoItem(id, data);
      const catalogoRes = await api.getCatalogo();
      setCatalogo(catalogoRes.items || []);
      return true;
    } catch (err) {
      setError('Falha ao atualizar item');
      console.error(err);
      return false;
    }
  };

  const value = {
    userRole,
    isAuthenticated,
    catalogo,
    cardapio,
    loading,
    error,
    loginAsManager,
    loginAsSommelier,
    logout,
    updateCatalogoItem,
    loadInitialData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}