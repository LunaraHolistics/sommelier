import React from 'react';
import './Header.css';

function Header({ userRole, onLogout, onModeChange, currentMode }) {
  const getRoleLabel = () => {
    switch(userRole) {
      case 'manager': return 'Gerente';
      case 'sommelier': return 'Sommelier';
      default: return 'Visitante';
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">🍷</span>
          <span className="logo-text">Sommelier</span>
        </div>
      </div>

      <div className="header-center">
        {userRole === 'sommelier' && (
          <div className="mode-switcher">
            <button 
              className={`mode-btn ${currentMode === 'client' ? 'active' : ''}`}
              onClick={() => onModeChange('client')}
            >
              👤 Cliente
            </button>
            <button 
              className={`mode-btn ${currentMode === 'sommelier' ? 'active' : ''}`}
              onClick={() => onModeChange('sommelier')}
            >
              🎓 Sommelier
            </button>
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="user-info">
          <span className="user-role">{getRoleLabel()}</span>
          <button className="btn-logout" onClick={onLogout}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;