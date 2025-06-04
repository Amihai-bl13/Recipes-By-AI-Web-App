import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { FaSun, FaMoon } from "react-icons/fa";
import "./App.css";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_URL = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light');
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' or 'oldest'
  const [placeholder, setPlaceholder] = useState(null);

  const handleLoginSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;
    try {
      const res = await axios.post(
        `${API_URL}/login/google`,
        { token },
        { withCredentials: true }
      );
      setUser(res.data.user);
      setPlaceholder('Tell me what ingredients you have, or describe the dish you\'re craving... ✨');
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

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/me`, { withCredentials: true });
      setUser(res.data);
    } catch (error) {
      // User not logged in
    }
  };

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt or ingredients to suggest a recipe.');
      return;
    }
    setLoading(true);
    setRecipe('');
    try {
      const res = await axios.post(
        `${API_URL}/suggest_recipe`,
        { message: prompt },
        { withCredentials: true }
      );
      setRecipe(res.data.recipe);
      setPrompt(''); // Clear prompt after submission
      setPlaceholder('Would you like to make any adjustments to the recipe or try something else?');
    } catch (err) {
      alert('Failed to fetch recipe suggestion.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmitPrompt();
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API_URL}/favorites`, { withCredentials: true });
      setFavorites(res.data.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const starRecipe = async () => {
    if (!recipe) return;
    
    // Try multiple patterns to extract title
    let title = 'Untitled Recipe';
    
    // First try to find h3 tag
    const h3Match = recipe.match(/<h3[^>]*>(.*?)<\/h3>/i);
    if (h3Match) {
      title = h3Match[1].replace(/<[^>]*>/g, '').trim(); // Remove any HTML tags within
    } else {
      // If no h3, look for the last line before first h4 or list
      const textBeforeStructure = recipe.split(/<h4|<ul|<ol/)[0];
      const lines = textBeforeStructure.split(/\n|<br\s*\/?>/);
      
      // Find the last non-empty line that looks like a title
      for (let i = lines.length - 1; i >= 0; i--) {
        const cleanLine = lines[i].replace(/<[^>]*>/g, '').trim();
        if (cleanLine && 
            !cleanLine.toLowerCase().includes('here\'s') && 
            !cleanLine.toLowerCase().includes('recipe') && 
            cleanLine.length > 3 && 
            cleanLine.length < 100) {
          title = cleanLine;
          break;
        }
      }
    }
    
    try {
      await axios.post(
        `${API_URL}/favorites`,
        { recipe, title },
        { withCredentials: true }
      );
      alert('Recipe starred successfully!');
      fetchFavorites();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to star recipe';
      alert(errorMessage);
    }
  };

  const removeFromFavorites = async (recipeId) => {
    try {
      await axios.delete(
        `${API_URL}/favorites`,
        { data: { recipe_id: recipeId }, withCredentials: true }
      );
      fetchFavorites(); // Refresh favorites list
    } catch (error) {
      alert('Failed to remove recipe from favorites');
    }
  };

  const sortedFavorites = [...favorites].sort((a, b) => {
    const dateA = new Date(a.date_added);
    const dateB = new Date(b.date_added);
    return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
  });

  // Initial load and theme setup
  useEffect(() => {
    fetchUser();
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]); // Include theme since it's used

  // Fetch favorites when user changes
  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]); // Only depends on user

  // Floating shapes component
  const FloatingShapes = () => (
    <div className="floating-shapes">
      <div className="shape"></div>
      <div className="shape"></div>
      <div className="shape"></div>
    </div>
  );

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <FloatingShapes />
      <div className="app-wrapper">
        <header className="header">
          <div className="header-controls">
            <button className="theme-btn" onClick={toggleTheme}>
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>
            {user && (
              <button className="logout-btn" onClick={handleLogout}>
                Sign Out
              </button>
            )}
          </div>
          <h1 className="logo">🍳 AI Recipe Chef</h1>
          <p className="tagline">Culinary magic at your fingertips</p>
        </header>

        {!user ? (
          <div className="login-area">
            <div className="card">
              <h2 className="login-title">Welcome to Your Kitchen</h2>
              <p className="login-subtitle">
                Sign in to discover amazing recipes tailored just for you ✨
              </p>
              <GoogleLogin 
                onSuccess={handleLoginSuccess} 
                onError={() => console.error('Login failed')} 
              />
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="user-info">
              <img 
                src={user.picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"} 
                alt="profile" 
                className="avatar" 
              />
              <div>
                <div className="welcome">Hey, {user.name || 'Chef'}!</div>
                <div className="subtext">What culinary adventure shall we embark on today?</div>
              </div>
            </div>

            <div className="favorites-section">
              <button 
                className="favorites-toggle-btn" 
                onClick={() => setShowFavorites(!showFavorites)}
              >
                📚 My Favorite Recipes ({favorites.length})
              </button>
              
              {showFavorites && (
                <div className="favorites-container">
                  <div className="favorites-header">
                    <h3>Starred Recipes</h3>
                    <button 
                      className="sort-btn"
                      onClick={() => setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')}
                    >
                      Sort: {sortOrder === 'latest' ? '⬇️ Newest First' : '⬆️ Oldest First'}
                    </button>
                  </div>
                  
                  <div className="favorites-list">
                    {sortedFavorites.map((fav) => (
                      <div key={fav.id} className="favorite-item">
                        <div className="favorite-info">
                          <h4>{fav.title}</h4>
                          <small>{new Date(fav.date_added).toLocaleDateString()}</small>
                        </div>
                        <div className="favorite-actions">
                          <button onClick={() => setSelectedRecipe(selectedRecipe?.id === fav.id ? null : fav)}>
                            {selectedRecipe?.id === fav.id ? '👁️ Hide' : '👁️ View'}
                          </button>
                          <button onClick={() => removeFromFavorites(fav.id)}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedRecipe && (
                    <div className="selected-recipe-inline">
                      <button className="exit-selected-recipe-btn" onClick={() => setSelectedRecipe(null)}>
                        ✕
                      </button>
                      <div 
                        className="recipe-text"
                        dangerouslySetInnerHTML={{ __html: selectedRecipe.content }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <textarea
              className="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows="4"
            />

            <button
              className="suggest-btn"
              onClick={handleSubmitPrompt}
              disabled={loading}
            >
              {loading ? '✨ Cooking...' : '🍽️ Create My Recipe'}
            </button>

            {recipe && (
              <div className="recipe-result">
                <div className="recipe-header">
                  <h2 className="result-title">
                    <span>✨</span>
                    <span>Your Personalized Recipe</span>
                  </h2>
                  <button className="star-btn" onClick={starRecipe}>
                    ⭐ Star Recipe
                  </button>
                </div>
                <div
                  className="recipe-text"
                  dangerouslySetInnerHTML={{ __html: recipe }}
                />
              </div>
            )}
            
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-modal">
            <div className="loader" />
            <p className="loading-text">Crafting your perfect recipe...</p>
            <p className="loading-subtext">This may take a moment</p>
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  );
}

export default App;