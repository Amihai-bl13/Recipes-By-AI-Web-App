// FloatingFoodShapes.js
import React from 'react';
import './FloatingShapes.css';

export default function FloatingFoodShapes() {
  const foodItems = [
    // Left side items
    { icon: '🍳', className: 'food-1', delay: '0s' },
    { icon: '🍕', className: 'food-2', delay: '-10s' },
    { icon: '🍝', className: 'food-3', delay: '-20s' },
    { icon: '🍰', className: 'food-4', delay: '-30s' },
    
    // Right side items
    { icon: '🥘', className: 'food-5', delay: '-5s' },
    { icon: '🥗', className: 'food-6', delay: '-15s' },
    { icon: '🥐', className: 'food-7', delay: '-25s' },
    { icon: '🥙', className: 'food-8', delay: '-35s' }
  ];

  return (
    <div className="floating-food">
      {foodItems.map((item, index) => (
        <div
          key={index}
          className={`food-item ${item.className}`}
          style={{ animationDelay: item.delay }}
        >
          {item.icon}
        </div>
      ))}
    </div>
  );
}