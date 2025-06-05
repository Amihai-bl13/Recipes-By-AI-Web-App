// FavoritesSection.js
import {React, useState} from 'react';
import './FavoritesSection.css';
import StylishConfirm from '../StylishConfirm/StylishConfirm';

export default function FavoritesSection({
  favorites,
  sortedFavorites,
  showFavorites,
  setShowFavorites,
  sortOrder,
  setSortOrder,
  selectedRecipe,
  setSelectedRecipe,
  removeFromFavorites
}) {

  const [showDeleteFromFavoritesConfirm, setShowDeleteFromFavoritesConfirm] = useState(false);
  const [toDeleteFromFavorites, setToDeleteFromFavorites] = useState(null);

  const confirmDeleteFromFavorites = async(recipeId) => {
    setToDeleteFromFavorites(recipeId);
    setShowDeleteFromFavoritesConfirm(true);
  }

  return (
    <div className="favorites-section">
      <button
        className="favorites-toggle-btn"
        onClick={() => setShowFavorites((prev) => !prev)}
      >
        📚 My Favorite Recipes ({favorites.length})
      </button>

      {showFavorites && (
        <div className="favorites-container">
          <div className="favorites-header">
            <h3>Starred Recipes</h3>
            <button
              className="sort-btn"
              onClick={() =>
                setSortOrder((prev) =>
                  prev === 'latest' ? 'oldest' : 'latest'
                )
              }
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
                  <button
                    onClick={() =>
                      setSelectedRecipe(
                        selectedRecipe?.id === fav.id ? null : fav
                      )
                    }
                  >
                    {selectedRecipe?.id === fav.id ? '❌ Hide' : '🔎 View'}
                  </button>
                  <button onClick={() => confirmDeleteFromFavorites(fav.id)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>

          {selectedRecipe && (
            <div className="selected-recipe-inline">
              <button
                className="exit-selected-recipe-btn"
                onClick={() => setSelectedRecipe(null)}
              >
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

      {showDeleteFromFavoritesConfirm && (
        <StylishConfirm
          message="Are you sure you want to remove this recipe from your favorites?"
          onConfirm={() => {
            removeFromFavorites(toDeleteFromFavorites);
            setShowDeleteFromFavoritesConfirm(false);
          }}
          onCancel={() => setShowDeleteFromFavoritesConfirm(false)}
        />
      )}
    </div>
  );
}
