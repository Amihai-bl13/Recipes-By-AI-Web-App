// UserDashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import './UserDashboard.css';
import StylishConfirm from '../StylishConfirm/StylishConfirm';
import FavoritesSection from '../FavoritesSection/FavoritesSection';
import RecipeResult from '../RecipeResult/RecipeResult';
import StylishAlert from '../StylishAlert/StylishAlert';

export default function UserDashboard({
  user,
  prompt,
  setPrompt,
  recipe,
  setRecipe,
  loading,
  setLoading,
  placeholder,
  setPlaceholder,
  favorites,
  setFavorites,
  showFavorites,
  setShowFavorites,
  selectedRecipe,
  setSelectedRecipe,
  sortOrder,
  setSortOrder,
  handleLogout
}) {
  //For local development, change this to your backend URL
  const API_URL = "http://localhost:5000";

  //For production, use the deployed backend URL
  // const API_URL = "https://recipes-by-ai-web-app.onrender.com";

  const [alertMessage, setAlertMessage] = useState('');
  const [showRecipeConfirm, setShowRecipeConfirm] = useState(false);
  const [showHistoryConfirm, setShowHistoryConfirm] = useState(false);

  const clearAlert = () => setAlertMessage('');

  const handleSubmitPrompt = async () => {
    if (!prompt.trim() || prompt.trim == '') {
      setAlertMessage('Please enter a prompt or ingredients to suggest a recipe.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/suggest_recipe`,
        { message: prompt },
        { withCredentials: true }
      );
      setRecipe(res.data.recipe);
      setPrompt('');
      setPlaceholder("Would you like to make any adjustments to the recipe or try something else?");
    } catch (err) {
      if (err.response?.data?.is_cooking_error) {
        setAlertMessage(err.response.data.error);
      } else {
        setAlertMessage('Failed to fetch recipe suggestion.');
      }
    } finally {
      setLoading(false);
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

  const handleConfirmClearRecipe = () => {
    setRecipe('');
    setPrompt('');
    setPlaceholder("Tell me what ingredients you have, or describe the dish you're craving... ✨");
    setShowRecipeConfirm(false);
  };

  const clearRecipe = () => {
    setShowRecipeConfirm(true);
  };

  const starRecipe = async () => {
    if (!recipe) return;

    let title = 'Untitled Recipe';
    const h3Match = recipe.match(/<h3[^>]*>(.*?)<\/h3>/i);
    if (h3Match) {
      title = h3Match[1].replace(/<[^>]*>/g, '').trim();
    } else {
      const textBeforeStructure = recipe.split(/<h4|<ul|<ol/)[0];
      const lines = textBeforeStructure.split(/\n|<br\s*\/?>/);
      for (let i = lines.length - 1; i >= 0; i--) {
        const cleanLine = lines[i].replace(/<[^>]*>/g, '').trim();
        if (
          cleanLine &&
          !cleanLine.toLowerCase().includes("here's") &&
          !cleanLine.toLowerCase().includes('recipe') &&
          cleanLine.length > 3 &&
          cleanLine.length < 100
        ) {
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
      setAlertMessage('Recipe starred successfully!');
      fetchFavorites();
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to star recipe';
      setAlertMessage(errMsg);
    }
  };

  const removeFromFavorites = async (recipeId) => {
    try {
      await axios.delete(
        `${API_URL}/favorites`,
        { data: { recipe_id: recipeId }, withCredentials: true }
      );
      setSelectedRecipe(null);
      fetchFavorites();
    } catch (error) {
      setAlertMessage('Failed to remove recipe from favorites');
    }
  };

  const handleConfirmClearHistory = async () => {
    try {
      await axios.post(`${API_URL}/clear_history`, {}, { withCredentials: true });
      setAlertMessage("Conversation history cleared.");
      setRecipe('');
      setPrompt('');
      setPlaceholder("Tell me what ingredients you have, or describe the dish you're craving... ✨");
    } catch (error) {
      console.error("Error clearing history:", error);
      setAlertMessage("Failed to clear history.");
    } finally {
      setShowHistoryConfirm(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  useEffect(() => {
    const onClearHistory = () => {
      setShowHistoryConfirm(true);
    };

    window.addEventListener('clearHistory', onClearHistory);
    return () => window.removeEventListener('clearHistory', onClearHistory);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmitPrompt();
    }
  };

  const sortedFavorites = [...favorites].sort((a, b) => {
    const dateA = new Date(a.date_added);
    const dateB = new Date(b.date_added);
    return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="card user-dashboard-card">
      <div className="user-info">
        <img
          src={
            user.picture ||
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
          }
          alt="profile"
          className="avatar"
        />
        <div>
          <div className="welcome">Hey, {user.name || 'Chef'}!</div>
          <div className="subtext">What culinary adventure shall we embark on today?</div>
        </div>
      </div>

      <FavoritesSection
        favorites={favorites}
        sortedFavorites={sortedFavorites}
        showFavorites={showFavorites}
        setShowFavorites={setShowFavorites}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        selectedRecipe={selectedRecipe}
        setSelectedRecipe={setSelectedRecipe}
        removeFromFavorites={removeFromFavorites}
      />

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
        <RecipeResult
          recipe={recipe}
          clearRecipe={clearRecipe}
          starRecipe={starRecipe}
        />
      )}

      {alertMessage && (
        <StylishAlert
          message={alertMessage}
          onClose={clearAlert}
          duration={3000}
        />
      )}

      {showRecipeConfirm && (
        <StylishConfirm
          message="Are you sure you want to clear the current recipe?"
          onConfirm={handleConfirmClearRecipe}
          onCancel={() => setShowRecipeConfirm(false)}
        />
      )}

      {showHistoryConfirm && (
        <StylishConfirm
          message="Are you sure you want to clear your chat history? This will delete all past messages."
          onConfirm={handleConfirmClearHistory}
          onCancel={() => setShowHistoryConfirm(false)}
        />
      )}
    </div>
  );
}
