// Header.js
import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import './Header.css';

export default function Header({
  user,
  toggleTheme,
  theme,
  handleLogout,
  setShowTimer
}) {
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
              onClick={() => {
                if (window.confirm("Are you sure you want to clear your chat history? (This will delete all past messages except the initial system prompt.)")) {
                  // Emitting a custom event (or call a passed callback if you prefer)
                  const event = new Event('clearHistory');
                  window.dispatchEvent(event);
                }
              }}
              style={{ marginLeft: '8px' }}
            >
              🗑️ Clear History
            </button>
          </>
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
