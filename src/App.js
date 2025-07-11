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
// const API_URL = "http://localhost:5000";

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

  const [loginMessage, setLoginMessage] = useState(null);
  const [hasFetchedUser, setHasFetchedUser] = useState(false);

  // --------------------
  //  AUTH / USER FETCH
  // --------------------
  const fetchUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await axios.get(`${API_URL}/me`);
      setUser(res.data);
      setPlaceholder("Tell me what ingredients you have…");
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        // real “you’re not logged in” case
        setAuthToken(null);
        setUser(null);
      } else if (status === 403) {
        // terms not accepted → show the modal, but keep your token
        setShowTerms(true);
      } else {
        // network glitch, CORS hiccup, etc.—don’t blow everything away
        console.warn("Could not fetch /me:", error);
      }
    }
  };

  const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
      // Set default axios header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  const pingBackend = async () => {
    try {
      const res = await axios.get(`${API_URL}/ping`, { timeout: 1500 }); // short timeout
      return res.status === 200;
    } catch {
      return false;
    }
  };

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const handleLoginSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;

    let backendReady = await pingBackend();

    if (!backendReady) {
      setLoading(true);
      setLoginMessage("Please stand by... the website is restarting itself and will be available shortly.");

      while (!backendReady) {
        await delay(5000);
        backendReady = await pingBackend();
      }
    }

    setLoginMessage("Logging you in…");

    try {
      const res = await axios.post(`${API_URL}/login/google`, { token });

      const userData = res.data.user;
      const jwtToken = res.data.token;
      const needsTerms = res.data.isNewUser;

      setAuthToken(jwtToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

      if (needsTerms) {
        setPendingUser(userData);
        setShowTerms(true);
        setHasFetchedUser(true);    // ← mark as fetched so /me won’t run again
      } else {
        setUser(userData);
        setPlaceholder("Tell me what ingredients you have, or describe the dish you're craving... ✨");
        setHasFetchedUser(true);
      }

    } catch (error) {
      console.error('Login error:', error);
      alert("Login failed. Please try again in a moment.");
    } finally {
      setLoading(false);
      setLoginMessage(null);
    }
  };

  const handleTermsAccept = async () => {
    try {
      // Set the user and hide terms
      setUser(pendingUser);
      setPendingUser(null);
      setShowTerms(false);
      setPlaceholder("Tell me what ingredients you have, or describe the dish you're craving... ✨");

      // Mark terms as accepted in backend
      await axios.post(
        `${API_URL}/accept-terms`, 
        {}
        // ,{ withCredentials: true }
      );
    } catch (error) {
      console.error('Error accepting terms:', error);
    }
  };

  const handleTermsDecline = async () => {
    try {
      // Log out the user since they declined terms
      await axios.post(`${API_URL}/logout`, {}
        // { ,withCredentials: true }
      );
      
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
      await axios.post(`${API_URL}/logout`);
      setRecipe('');
      setPrompt('');
    } catch (error) {
      console.error('Logout error:', error);
    } finally{
      setHasFetchedUser(false);
      setAuthToken(null); // Clear JWT token
      setUser(null);
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
    const token = getAuthToken();
    if (token && !hasFetchedUser && !showTerms) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser().then(() => setHasFetchedUser(true));
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme, hasFetchedUser, showTerms]);
  
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

      {loading && (
        <LoadingOverlay
          text={loginMessage || "Crafting your perfect recipe..."}
          subtext={loginMessage ? "This may take up to 1 min." : "This may take a moment"}
        />
      )}
    </GoogleOAuthProvider>
  );
}

export default App;
