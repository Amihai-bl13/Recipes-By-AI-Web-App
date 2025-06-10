export default function Logo() {
  return (
    <svg viewBox="0 0 320 100" width="80%" height="80%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Premium gradients */}
        <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A00" stopOpacity="1" />
          <stop offset="50%" stopColor="#FF6B35" stopOpacity="1" />
          <stop offset="100%" stopColor="#D2691E" stopOpacity="1" />
        </linearGradient>
        
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB366" stopOpacity="1" />
          <stop offset="100%" stopColor="#FF8C42" stopOpacity="1" />
        </linearGradient>
        
        {/* Subtle glow effect */}
        <filter id="subtleGlow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Text shadow */}
        <filter id="textShadow">
          <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="#00000020"/>
        </filter>
      </defs>
      
      {/* Sophisticated icon */}
      <g transform="translate(15, 15)">
        {/* Elegant chef hat with modern twist */}
        <path d="M30 50 Q10 35 15 20 Q15 8 25 8 Q30 2 35 8 Q45 8 45 20 Q50 35 30 50 Z" 
              fill="url(#mainGradient)" filter="url(#subtleGlow)"/>
        
        {/* Hat band */}
        <ellipse cx="30" cy="48" rx="20" ry="5" fill="url(#accentGradient)" opacity="0.9"/>
        
        {/* Refined details */}
        <circle cx="25" cy="25" r="1" fill="#FFFFFF" opacity="0.4"/>
        <circle cx="35" cy="23" r="1" fill="#FFFFFF" opacity="0.4"/>
        <circle cx="30" cy="35" r="1" fill="#FFFFFF" opacity="0.3"/>
        
        {/* Subtle sparkle effect */}
        <path d="M40 15 L42 17 L40 19 L38 17 Z" fill="#FFFFFF" opacity="0.6"/>
        <path d="M20 30 L21 31 L20 32 L19 31 Z" fill="#FFFFFF" opacity="0.4"/>
      </g>
      
      {/* Premium typography */}
      <g transform="translate(85, 0)">
        {/* "AI" with special treatment */}
        <text x="0" y="35" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="800" 
              fill="url(#mainGradient)" filter="url(#textShadow)">AI</text>
        
        {/* "RECIPE" with lighter weight */}
        <text x="50" y="35" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="300" 
              fill="#8B4513" filter="url(#textShadow)">RECIPE</text>
        
        {/* "CHEF" with emphasis */}
        <text x="0" y="65" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="700" 
              fill="url(#mainGradient)" filter="url(#textShadow)">CHEF</text>
        
        {/* Elegant subtitle */}
        <text x="0" y="85" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="400" 
              fill="#8B4513" opacity="0.8" fontStyle="italic">
          Culinary magic at your fingertips
        </text>
      </g>
      
      {/* Modern decorative elements */}
      <circle cx="75" cy="25" r="2" fill="url(#accentGradient)" opacity="0.5"/>
      <circle cx="70" cy="45" r="1.5" fill="url(#mainGradient)" opacity="0.4"/>
      <circle cx="78" cy="60" r="1" fill="url(#accentGradient)" opacity="0.6"/>
      
      {/* Connecting accent */}
      <path d="M75 35 Q80 40 82 35" stroke="url(#accentGradient)" strokeWidth="1.5" 
            fill="none" opacity="0.4"/>
    </svg>
  );
}