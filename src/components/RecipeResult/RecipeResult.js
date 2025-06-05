// RecipeResult.js
import React from 'react';
import './RecipeResult.css';

export default function RecipeResult({
  recipe,
  clearRecipe,
  starRecipe
}) {
  return (
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
  );
}
