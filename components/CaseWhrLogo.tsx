interface CaseWhrLogoProps {
  className?: string;
  showText?: boolean;
  textColor?: string;
}

export default function CaseWhrLogo({ 
  className = "h-12", 
  showText = true,
  textColor = "#003366"
}: CaseWhrLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon: Blue rounded square with white arrow */}
      <svg 
        viewBox="0 0 100 100" 
        className="h-full w-auto"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rounded square background */}
        <rect 
          width="100" 
          height="100" 
          rx="16" 
          fill="#003366"
        />
        {/* White right arrow - more accurate to original */}
        <path 
          d="M 25 50 L 55 50 M 48 35 L 70 50 L 48 65" 
          stroke="white" 
          strokeWidth="9" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        <path 
          d="M 48 35 L 75 50 L 48 65 Z" 
          fill="white"
        />
      </svg>
      
      {/* Text: CASE WHERE */}
      {showText && (
        <svg 
          viewBox="0 0 380 140" 
          className="h-full w-auto"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <text 
            x="0" 
            y="60" 
            fill={textColor}
            fontSize="68"
            fontWeight="800"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="-1"
          >
            CASE
          </text>
          <text 
            x="0" 
            y="128" 
            fill={textColor}
            fontSize="68"
            fontWeight="800"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="-1"
          >
            WHERE
          </text>
        </svg>
      )}
    </div>
  );
}