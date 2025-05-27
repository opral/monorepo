import { useEffect, useRef } from "react";
import FlashIcon from "./FlashIcon";

// LixIcon component
const LixIcon = ({ size = 24, className = "" }) => {
  return (
    <svg
      width={size}
      height={size * 0.7} // Maintain aspect ratio
      viewBox="0 0 26 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M14.7618 5.74842L16.9208 9.85984L22.3675 0.358398H25.7133L19.0723 11.6284L22.5712 17.5085H19.2407L16.9208 13.443L14.6393 17.5085H11.2705L14.7618 11.6284L11.393 5.74842H14.7618Z"
        fill="currentColor"
      />
      <path
        d="M6.16211 17.5081V5.74805H9.42368V17.5081H6.16211Z"
        fill="currentColor"
      />
      <path
        d="M3.52112 0.393555V17.6416H0.287109V0.393555H3.52112Z"
        fill="currentColor"
      />
      <path
        d="M6.21582 0.393555H14.8399V3.08856H6.21582V0.393555Z"
        fill="currentColor"
      />
    </svg>
  );
};

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "" }: LogoProps) => {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // One-time flicker animation
    const logo = logoRef.current;
    if (logo) {
      setTimeout(() => {
        logo.classList.add("opacity-70");
        setTimeout(() => {
          logo.classList.remove("opacity-70");
        }, 100);
      }, 1000);
    }
  }, []);

  return (
    <div
      ref={logoRef}
      className={`flex items-center gap-2 transition-opacity duration-100 ${className}`}
    >
      <div className="flex items-center gap-2">
        <FlashIcon size={24} />
        <span className="text-xl font-semibold tracking-tight">Flashtype</span>
      </div>

      <div className="flex items-center text-xs ml-2 mt-0.5">
        <a
          href="https://github.com/opral/monorepo/tree/main/packages/lix-sdk"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center hover:opacity-80 transition-opacity hover:cursor-pointer text-gray-400"
          style={{ pointerEvents: "auto" }}
        >
          <span className="mr-1">powered by</span>
          <span className="font-medium text-[#08B5D6] lix-logo-slow text-[0px]">
            <span className="flex items-center">
              <LixIcon
                size={14}
                className="mr-0.5 text-[#08B5D6] lix-logo-slow"
              />
              lix
            </span>
          </span>
        </a>
      </div>
    </div>
  );
};

export default Logo;
