import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  pictureUrl: string;
  authenticated: boolean;
}

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    try {
      // Call our custom logout endpoint
      await axios.post('/api/auth/logout', {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Force page reload to clear React state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if there's an error
      window.location.href = '/login';
    }
  };

  return (
    <header className="app-header">
      <div className="logo">
        <Link to="/">Alarm Clock App</Link>
      </div>

      <nav>
        {user ? (
          <div className="user-menu">
            <span className="user-name">{user.name}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="login-link">Login</Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
