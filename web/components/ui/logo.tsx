import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ 
  width = 200, 
  height = 200 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
    >
      {/* Circle element of the logo */}
      <circle 
        cx="100" 
        cy="100" 
        r="80" 
        style={{ fill: '#FF0000' }} 
      />
      {/* Text element of the logo */}
      <text 
        x="50%" 
        y="50%" 
        textAnchor="middle" 
        dy=".3em"
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '48px',
          fill: '#000000'
        }}
      >
        Logo
      </text>
    </svg>
  );
};

export default Logo;
