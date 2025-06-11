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
import TermsAndConditions from './components/TermsAndConditions/TermsAndConditions'; // NEW IMPORT

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

//For local development, change this to your backend URL
//const API_URL = "http://localhost:5000";

//For production, use the deployed backend URL
const API_URL = "https://recipes-by-ai-web-app.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  // Shared states for child components:
  const [loading, setLoading] = useState(false);

  // NEW: Terms & Conditions states
  const [showTerms, setShowTerms] = useState(false);
  const [pendingUser, setPendingUser] = useState(null); // Store user data until terms accepted

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
      
      const userData = res.data.user;
      const needsTerms = res.data.isNewUser; // This now covers both new users and users who haven't accepted terms
      
      if (needsTerms) {
        // Show terms for users who need to accept them
        setPendingUser(userData);
        setShowTerms(true);
      } else {
        // User has already accepted terms - proceed normally
        setUser(userData);
        setPlaceholder("Tell me what ingredients you have, or describe the dish you're craving... ✨");
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleTermsAccept = async () => {
    try {
      // Mark terms as accepted in backend
      await axios.post(`${API_URL}/accept-terms`, {}, { withCredentials: true });
      
      // Set the user and hide terms
      setUser(pendingUser);
      setPendingUser(null);
      setShowTerms(false);
      setPlaceholder("Tell me what ingredients you have, or describe the dish you're craving... ✨");
    } catch (error) {
      console.error('Error accepting terms:', error);
    }
  };

  const handleTermsDecline = async () => {
    try {
      // Log out the user since they declined terms
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      
      // Reset states
      setPendingUser(null);
      setShowTerms(false);
      setUser(null);
    } catch (error) {
      console.error('Error declining terms:', error);
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

        {/* Show Terms & Conditions modal for new users */}
        {showTerms && (
          <TermsAndConditions
            onAccept={handleTermsAccept}
            onDecline={handleTermsDecline}
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