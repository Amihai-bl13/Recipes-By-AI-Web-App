// Header.js
import {React, useState} from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import './Header.css';
import StylishConfirm from '../StylishConfirm/StylishConfirm';

export default function Header({
  user,
  toggleTheme,
  theme,
  handleLogout,
  setShowTimer
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  const handleClearRequest = () => {
      setOnConfirmAction(() => () => {
          setShowConfirm(false);
          window.dispatchEvent(new Event('clearHistory'));
      });
      setShowConfirm(true);
  };

  return (
    <header className="header">
      <div className="header-controls">
        <button className="theme-btn" onClick={toggleTheme}>
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>

        {user && (
          <>
            <button className="logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
            <button
              className="logout-btn"
              style={{ marginLeft: '8px' }}
              onClick={handleClearRequest}
            >
              🗑️ Clear History
            </button>
          </>
        )}

        {showConfirm && (
            <StylishConfirm
                message="Are you sure you want to clear your chat history?"
                onConfirm={onConfirmAction}
                onCancel={() => setShowConfirm(false)}
            />
        )}

        {user && (
          <button
            className="timer-toggle-btn"
            onClick={() => setShowTimer((prev) => !prev)}
          >
            ⏰
          </button>
        )}
      </div>

      <h1 className="logo">🍳 AI Recipe Chef</h1>
      <p className="tagline">Culinary magic at your fingertips</p>
    </header>
  );
}
