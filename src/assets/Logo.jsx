export default function Logo() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // don't block clicks
        zIndex: -1, // ensure it stays behind other elements
      }}
    >
      <svg
        viewBox="0 0 250 100"
        width="80%"
        height="80%"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          pointerEvents: 'none', // prevent any click interference
        }}
      >
        <defs>
          {/* Orange gradient collection */}
          <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7A00" />
            <stop offset="30%" stopColor="#FF6B35" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D2691E" />
          </linearGradient>
          
          <linearGradient id="chefHatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB366" />
            <stop offset="50%" stopColor="#FF8C42" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>
          
          <linearGradient id="panGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A5568" />
            <stop offset="50%" stopColor="#2D3748" />
            <stop offset="100%" stopColor="#1A202C" />
          </linearGradient>
          
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C2410C" />
            <stop offset="50%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          
          <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF8C42" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#FF7A00" stopOpacity="0"/>
          </radialGradient>
          
          {/* Minimal filters to prevent interference */}
          <filter id="epicGlow" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="premiumShadow" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.1"/>
          </filter>
          
          <filter id="floatingShadow" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.05"/>
          </filter>
        </defs>
        
        {/* Background glow aura - contained */}
        <circle cx="45" cy="45" r="25" fill="url(#glowGradient)" opacity="0.2"/>
        
        {/* Robot Chef with hands - moved closer to text */}
        <g transform="translate(18, 15) scale(0.85)">
          {/* Robot body */}
          <rect x="20" y="25" width="28" height="32" rx="5" ry="5" 
                fill="url(#robotGradient)" filter="url(#premiumShadow)"/>
          
          {/* Head section */}
          <rect x="20" y="25" width="28" height="14" rx="5" ry="5" 
                fill="url(#robotGradient)" opacity="0.9"/>
          <rect x="20" y="34" width="28" height="7" fill="url(#robotGradient)"/>
          
          {/* Chef hat - tall and puffy toque */}
          <ellipse cx="34" cy="24" rx="12" ry="2.5" fill="#E2E8F0" opacity="0.8"/>
          {/* Main hat body - tall and cylindrical */}
          <rect x="24" y="8" width="20" height="18" rx="2" fill="url(#chefHatGradient)" filter="url(#premiumShadow)"/>
          {/* Puffy top section */}
          <ellipse cx="34" cy="8" rx="10" ry="4" fill="url(#chefHatGradient)" filter="url(#premiumShadow)"/>
          {/* Extra puff details */}
          <ellipse cx="30" cy="10" rx="3" ry="2" fill="#FFFFFF" opacity="0.6"/>
          <ellipse cx="38" cy="12" rx="3" ry="2" fill="#FFFFFF" opacity="0.6"/>
          <ellipse cx="34" cy="14" rx="4" ry="2.5" fill="#FFFFFF" opacity="0.4"/>
          {/* Hat band */}
          <rect x="24" y="22" width="20" height="3" rx="1" fill="#E2E8F0" opacity="0.9"/>
          
          {/* Glowing eyes */}
          <circle cx="28" cy="31" r="2.2" fill="#FF8C42" filter="url(#epicGlow)"/>
          <circle cx="40" cy="31" r="2.2" fill="#FF8C42" filter="url(#epicGlow)"/>
          <circle cx="28" cy="31" r="1" fill="#FFFFFF" opacity="0.9"/>
          <circle cx="40" cy="31" r="1" fill="#FFFFFF" opacity="0.9"/>
          
          {/* Digital mouth */}
          <rect x="30" y="36" width="8" height="2.5" rx="1.2" fill="#C2410C" opacity="0.8"/>
          <line x1="31" y1="37" x2="37" y2="37" stroke="#FF8C42" strokeWidth="0.3"/>
          
          {/* Chest panel */}
          <rect x="23" y="43" width="22" height="10" rx="2" fill="#C2410C" opacity="0.3"/>
          <circle cx="27" cy="48" r="1.3" fill="url(#accentGradient)" filter="url(#epicGlow)"/>
          <circle cx="34" cy="48" r="1.3" fill="#10B981" filter="url(#epicGlow)"/>
          <circle cx="41" cy="48" r="1.3" fill="#EF4444" filter="url(#epicGlow)"/>
          
          {/* Robot Arms with animation */}
          <g>
            <rect x="13" y="35" width="6" height="18" rx="3" fill="url(#robotGradient)" filter="url(#premiumShadow)"/>
            <rect x="49" y="35" width="6" height="18" rx="3" fill="url(#robotGradient)" filter="url(#premiumShadow)">
              <animateTransform attributeName="transform" type="rotate" 
                              values="0 52 44;-10 52 44;0 52 44" dur="4s" repeatCount="indefinite"/>
            </rect>
          </g>
          
          {/* Robot Hands with flipping motion */}
          <circle cx="16" cy="55" r="4" fill="url(#robotGradient)" filter="url(#premiumShadow)"/>
          <g>
            <circle cx="52" cy="55" r="4" fill="url(#robotGradient)" filter="url(#premiumShadow)">
              <animateTransform attributeName="transform" type="rotate" 
                              values="0 52 55;-15 52 55;0 52 55" dur="4s" repeatCount="indefinite"/>
            </circle>
          </g>
          
          {/* Fingers/grippers */}
          <rect x="14" y="52" width="1" height="6" rx="0.5" fill="url(#accentGradient)"/>
          <rect x="17" y="52" width="1" height="6" rx="0.5" fill="url(#accentGradient)"/>
          <g>
            <rect x="50" y="52" width="1" height="6" rx="0.5" fill="url(#accentGradient)">
              <animateTransform attributeName="transform" type="rotate" 
                              values="0 50.5 55;-15 50.5 55;0 50.5 55" dur="4s" repeatCount="indefinite"/>
            </rect>
            <rect x="53" y="52" width="1" height="6" rx="0.5" fill="url(#accentGradient)">
              <animateTransform attributeName="transform" type="rotate" 
                              values="0 53.5 55;-15 53.5 55;0 53.5 55" dur="4s" repeatCount="indefinite"/>
            </rect>
          </g>
          
          {/* Animated Spatula in hand - flatter and darker */}
          <g>
            <g>
              <animateTransform attributeName="transform" type="rotate" 
                              values="0 52 55;-20 52 55;0 52 55" dur="4s" repeatCount="indefinite"/>
              <rect x="54" y="50" width="1.5" height="12" rx="0.7" fill="#D2691E"/>
              <path d="M53 44 L59 44 Q60 44.5 59 47 L53 47 Q52 46.5 52 45 Q52 44 53 44 Z" 
                    fill="#D2691E" opacity="0.95"/>
            </g>
          </g>
          
          {/* Cooking Pan being held */}
          <ellipse cx="34" cy="58" rx="14" ry="4" fill="url(#panGradient)" filter="url(#premiumShadow)"/>
          <ellipse cx="34" cy="57" rx="12" ry="3" fill="#4A5568" opacity="0.8"/>
          <rect x="47" y="56" width="8" height="2" rx="1" fill="url(#panGradient)"/>
          
          {/* Animated ingredients floating above pan */}
          <g>
            {/* Tomato slice */}
            <ellipse cx="30" cy="55" rx="2" ry="1" fill="#E53E3E">
              <animateTransform attributeName="transform" type="translate" 
                              values="0,0;1,-4;0,0" dur="4s" repeatCount="indefinite"/>
            </ellipse>
            <circle cx="29" cy="55" r="0.3" fill="#C53030" opacity="0.8">
              <animateTransform attributeName="transform" type="translate" 
                              values="0,0;1,-4;0,0" dur="4s" repeatCount="indefinite"/>
            </circle>
            
            {/* Onion piece */}
            <ellipse cx="34" cy="55" rx="1.5" ry="1" fill="#FBBF24">
              <animateTransform attributeName="transform" type="translate" 
                              values="0,0;-1,-5;0,0" dur="4.2s" repeatCount="indefinite"/>
            </ellipse>
            <path d="M33 55 Q34 54.5 35 55" stroke="#F59E0B" strokeWidth="0.3" fill="none">
              <animateTransform attributeName="transform" type="translate" 
                              values="0,0;-1,-5;0,0" dur="4.2s" repeatCount="indefinite"/>
            </path>
            
            {/* Herb/Parsley */}
            <ellipse cx="38" cy="56" rx="1" ry="0.8" fill="#10B981">
              <animateTransform attributeName="transform" type="translate" 
                              values="0,0;2,-3;0,0" dur="3.8s" repeatCount="indefinite"/>
            </ellipse>
            <rect x="37.5" y="55.5" width="0.3" height="1" rx="0.15" fill="#059669">
              <animateTransform attributeName="transform" type="translate" 
                              values="0,0;2,-3;0,0" dur="3.8s" repeatCount="indefinite"/>
            </rect>
          </g>
          
          {/* Steam/cooking effect from pan */}
          <g opacity="0.5">
            <path d="M30 54 Q32 51 30 48" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite"/>
            </path>
            <path d="M34 54 Q36 50 34 47" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.3">
              <animate attributeName="opacity" values="0.4;0.7;0.4" dur="3.5s" repeatCount="indefinite"/>
            </path>
            <path d="M38 54 Q40 51 38 48" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite"/>
            </path>
          </g>
        </g>
        
        {/* Typography - moved closer to robot and repositioned */}
        <g transform="translate(85, 18)">
          <text x="0" y="20" fontFamily="system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="900" 
                fill="url(#robotGradient)" filter="url(#premiumShadow)" letterSpacing="-1px">AI</text>
          
          <text x="28" y="20" fontFamily="system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="500" 
                fill="url(#textGradient)" filter="url(#premiumShadow)" letterSpacing="0.5px">RECIPE</text>
          
          <text x="0" y="38" fontFamily="system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="800" 
                fill="url(#robotGradient)" filter="url(#premiumShadow)" letterSpacing="-0.5px">CHEF</text>
          
          <text x="0" y="52" fontFamily="system-ui, -apple-system, sans-serif" fontSize="8" fontWeight="500" 
                fill="#f25616" opacity="0.9" letterSpacing="0.8px">
            COOK SMART, EAT AMAZING
          </text>
          
          <rect x="0" y="54" width="125" height="0.8" fill="url(#accentGradient)" opacity="0.6"/>
        </g>
        
        {/* Animated sparkles - minimal decoration */}
        <g>
          <path d="M25 30 L26.5 31.5 L25 33 L23.5 31.5 Z" fill="url(#accentGradient)">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite"/>
          </path>
          <path d="M70 25 L71.2 26.2 L70 27.4 L68.8 26.2 Z" fill="url(#accentGradient)">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3.5s" repeatCount="indefinite"/>
          </path>
        </g>
        
      </svg>
    </div>
  );
}