// App.js
import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { FaSun, FaMoon } from "react-icons/fa";

import './App.css'; // only global/theme + resets

/* Import all the components we created below */
import FloatingShapes from './components/FloatingShapes/FloatingShapes';
import Header from './components/Header/Header';
import LoginArea from './components/LoginArea/LoginArea';
import UserDashboard from './components/UserDashboard/UserDashboard';
import Timer from './components/Timer/Timer';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_URL = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  // Shared states for child components:
  const [loading, setLoading] = useState(false);

  // For passing into UserDashboard:
  const [recipe, setRecipe] = useState('');
  const [prompt, setPrompt] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [sortOrder, setSortOrder] = useState('latest');
  const [placeholder, setPlaceholder] = useState(null);

  // Timer states (to pass into <Timer />)
  const [showTimer, setShowTimer] = useState(false);

  // --------------------
  //  AUTH / USER FETCH
  // --------------------
  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/me`, { withCredentials: true });
      setUser(res.data);
      setPlaceholder("Tell me what ingredients you have, or describe the dish you're craving... ✨");
    } catch (error) {
      // not logged in
    }
  };

  const handleLoginSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;
    try {
      const res = await axios.post(
        `${API_URL}/login/google`,
        { token },
        { withCredentials: true }
      );
      setUser(res.data.user);
      setPlaceholder("Tell me what ingredients you have, or describe the dish you're craving... ✨");
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      setUser(null);
      setRecipe('');
      setPrompt('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // --------------------
  //  THEME TOGGLER
  // --------------------
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // --------------------
  //  INITIAL EFFECTS
  // --------------------
  useEffect(() => {
    fetchUser();
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <FloatingShapes />

      <div className="app-wrapper">
        <Header
          user={user}
          toggleTheme={toggleTheme}
          theme={theme}
          handleLogout={handleLogout}
          setShowTimer={setShowTimer}
        />

        {showTimer && (
          <Timer
            setShowTimer={setShowTimer}
          />
        )}

        { !user ? (
          <LoginArea
            handleLoginSuccess={handleLoginSuccess}
          />
        ) : (
          <UserDashboard
            user={user}
            prompt={prompt}
            setPrompt={setPrompt}
            recipe={recipe}
            setRecipe={setRecipe}
            loading={loading}
            setLoading={setLoading}
            placeholder={placeholder}
            setPlaceholder={setPlaceholder}
            favorites={favorites}
            setFavorites={setFavorites}
            showFavorites={showFavorites}
            setShowFavorites={setShowFavorites}
            selectedRecipe={selectedRecipe}
            setSelectedRecipe={setSelectedRecipe}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            handleLogout={handleLogout}
          />
        )}
      </div>

      {loading && <LoadingOverlay />}
    </GoogleOAuthProvider>
  );
}

export default App;
