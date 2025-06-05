import React, { useState, useEffect, useRef } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { FaSun, FaMoon } from "react-icons/fa";
import "./App.css";
import bellSound from './assets/bellSound.mp3';

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

  // Timer states
  const [showTimer, setShowTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState('');
  const [timerSeconds, setTimerSeconds] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const timerIntervalRef = useRef(null);
  const audioRef = useRef(null);
  const [timerPosition, setTimerPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
    //setRecipe('');
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
      // If the backend returned a “non‐cooking” error, show it
      if (err.response && err.response.data && err.response.data.is_cooking_error) {
        alert(err.response.data.error);
      } else {
        alert('Failed to fetch recipe suggestion.');
      }
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

  const clearRecipe = async () => {
    if (!window.confirm("Are you sure you want to clear the current recipe?")) {
      return;
    }
    setRecipe('');
    setPrompt('');
    setPlaceholder("Tell me what ingredients you have, or describe the dish you're craving... ✨");
  }

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

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your chat history? (This will delete all past messages except the initial system prompt.)")) {
      return;
    }
    try {
      await axios.post(`${API_URL}/clear_history`, {}, { withCredentials: true });
      alert("Conversation history cleared.");
      setRecipe('');
      setPrompt('');
      setPlaceholder("Tell me what ingredients you have, or describe the dish you're craving... ✨");
    } catch (error) {
      console.error("Error clearing history:", error);
      alert("Failed to clear history.");
    }
  };

  // Timer functions
  const startTimer = () => {
    // Only set time from inputs if timer is at 0 (fresh start)
    if (timeLeft === 0) {
      const minutes = parseInt(timerMinutes) || 0;
      const seconds = parseInt(timerSeconds) || 0;
      const totalSeconds = minutes * 60 + seconds;
      
      if (totalSeconds <= 0) {
        alert('Please enter a valid time');
        return;
      }
      
      setTimeLeft(totalSeconds);
    }
    
    // Just resume the timer with current timeLeft
    setIsTimerRunning(true);
    setTimerFinished(false);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(0);
    setTimerFinished(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerMouseDown = (e) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Set the current position based on where the timer actually is
    setTimerPosition({
      x: rect.left,
      y: rect.top
    });
  };

  const handleTimerMouseMove = (e) => {
    if (!isDragging) return;
    
    setTimerPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleTimerMouseUp = () => {
    setIsDragging(false);
  };

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

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setTimerFinished(true);
            // Play sound
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleTimerMouseMove);
      document.addEventListener('mouseup', handleTimerMouseUp);
    } else {
      document.removeEventListener('mousemove', handleTimerMouseMove);
      document.removeEventListener('mouseup', handleTimerMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleTimerMouseMove);
      document.removeEventListener('mouseup', handleTimerMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (timerFinished) {
      const timeout = setTimeout(() => {
        setTimerFinished(false);
      }, 3000); // Animation duration: 1s * 3 iterations

      return () => clearTimeout(timeout);
    }
  }, [timerFinished]);

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
              <>
                <button className="logout-btn" onClick={handleLogout}>
                  Sign Out
                </button>

                <button className="logout-btn" onClick={handleClearHistory} style={{ marginLeft: '8px' }}>
                  🗑️ Clear History
                </button>
              </>
            )}
            {user && (<button className="timer-toggle-btn" onClick={() => setShowTimer(!showTimer)}>
              ⏰
            </button>)}
          </div>
          <h1 className="logo">🍳 AI Recipe Chef</h1>
          <p className="tagline">Culinary magic at your fingertips</p>
        </header>

        {showTimer && (
          <div 
            className={`floating-timer ${timerFinished ? 'timer-finished' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{
              ...(timerPosition.x !== 0 || timerPosition.y !== 0 
                ? {
                    left: `${timerPosition.x}px`,
                    top: `${timerPosition.y}px`,
                    right: 'auto'
                  }
                : {
                    top: '120px',
                    right: '20px'
                  }
              )
            }}
            onMouseDown={handleTimerMouseDown}
          >
            <div className="timer-header">
              <span>⏰ Kitchen Timer</span>
              <button className="timer-close" onClick={() => setShowTimer(false)}>×</button>
            </div>
            
            {timeLeft === 0 && !isTimerRunning ? (
              <div className="timer-setup">
                <div className="time-inputs">
                  <input
                    type="number"
                    placeholder="MM"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(e.target.value)}
                    min="0"
                    max="59"
                  />
                  <span>:</span>
                  <input
                    type="number"
                    placeholder="SS"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(e.target.value)}
                    min="0"
                    max="59"
                  />
                </div>
                <button className="timer-start-btn" onClick={startTimer}>
                  Start Timer
                </button>
              </div>
            ) : (
              <div className="timer-display">
                <div className="timer-time">{formatTime(timeLeft)}</div>
                  <div className="timer-controls">
                    <button onClick={isTimerRunning ? pauseTimer : startTimer}>
                      {isTimerRunning ? '⏸️' : (timeLeft > 0 ? '▶️' : '▶️')}
                    </button>
                    <button onClick={resetTimer}>🔄</button>
                  </div>
                {timerFinished && <div className="timer-alert">⏰ Time's Up!</div>}
              </div>
            )}
            
            <audio ref={audioRef} preload="auto">
              <source src={bellSound} type="audio/mp3" />
            </audio>
          </div>
        )}

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
                          <button onClick={() => removeFromFavorites(fav.id)}>🗑️ Delete</button>
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
                  <button className="clear-btn" onClick={clearRecipe}>
                    ♻ Clear Recipe
                  </button>
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