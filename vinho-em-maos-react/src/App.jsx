import React, { useState, useContext } from 'react';
import { AppContext } from './contexts/AppContext';
import Header from './components/Header';
import Login from './views/Login';
import ManagerDashboard from './views/Manager/ManagerDashboard';
import SommelierView from './views/Sommelier/SommelierView';
import './App.css';

function App() {
  const { userRole, isAuthenticated, logout } = useContext(AppContext);
  const [currentMode, setCurrentMode] = useState('client');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Header 
        userRole={userRole}
        onLogout={logout}
        onModeChange={setCurrentMode}
        currentMode={currentMode}
      />
      
      {userRole === 'manager' && <ManagerDashboard />}
      
      {userRole === 'sommelier' && (
        <SommelierView mode={currentMode} />
      )}
    </div>
  );
}

export default App;