import React, { useContext } from 'react';
import { AppContext } from './contexts/AppContext';
import Login from './views/Login';
import ManagerDashboard from './views/Manager/ManagerDashboard';
import SommelierView from './views/Sommelier/SommelierView';

function App() {
  const context = useContext(AppContext);
  
  // Verifica se o contexto está disponível
  if (!context) {
    return <div>Erro: Contexto não disponível</div>;
  }

  const { userRole, isAuthenticated } = context;

  if (!isAuthenticated) {
    return <Login />;
  }

  if (userRole === 'manager') {
    return <ManagerDashboard />;
  }

  if (userRole === 'sommelier') {
    return <SommelierView />;
  }

  return <Login />;
}

export default App;