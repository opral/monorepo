import { SVGProps } from 'react';

interface FlashIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

const FlashIcon = ({ size = 24, className = "", ...props }: FlashIconProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`text-yellow-primary ${className}`}
      {...props}
    >
      <path 
        d="M13 3L4 14H12L11 21L20 10H12L13 3Z" 
        fill="currentColor" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default FlashIcon;