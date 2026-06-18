import React, { useContext } from 'react';
import { AppContext } from './contexts/AppContext';
import Login from './views/Login';
import ManagerDashboard from './views/Manager/ManagerDashboard';
import SommelierView from './views/Sommelier/SommelierView';

function App() {
  const { userRole, isAuthenticated } = useContext(AppContext);

  // Não autenticado → Login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Gerente → Dashboard completo
  if (userRole === 'manager') {
    return <ManagerDashboard />;
  }

  // Garçom/Cliente → Visão do sommelier
  if (userRole === 'sommelier') {
    return <SommelierView />;
  }

  return <Login />;
}

export default App;