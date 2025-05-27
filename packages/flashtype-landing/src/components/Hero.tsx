import { useState, useEffect } from "react";
import Logo from "./Logo";
import PromptInput from "./PromptInput";
import PromptPills from "./PromptPills";
import { Sparkles } from "lucide-react";
import { IconBrandDiscord, IconBrandGithub } from "@tabler/icons-react";

// LixIcon component for the Change Control feature
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

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>();
  const [pillsVisible, setPillsVisible] = useState(false);

  useEffect(() => {
    // Animate in on load
    setIsVisible(true);

    // Slight delay for pills to appear after main content
    const timer = setTimeout(() => {
      setPillsVisible(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const handlePromptSelected = (prompt: string) => {
    setSelectedPrompt(prompt);
  };

  const handlePromptAnimationComplete = () => {
    // Reset after animation completes
    setSelectedPrompt(undefined);
  };

  return (
    <section className="relative min-h-[100svh] md:min-h-[60vh] w-full flex flex-col px-4 overflow-hidden">
      {/* Dithering effect overlay */}
      <div className="dithering"></div>

      {/* Navbar with logo and waitlist button */}
      <div className="w-full pt-6 pb-2 z-20 relative">
        <div className="container mx-auto px-4">
          {/* Desktop layout */}
          <div className="hidden md:flex justify-between items-center">
            <Logo />
            <div className="flex items-center">
              {/* Social icons navigation */}
              <div className="flex items-center space-x-4 mr-6">
                {/* Discord */}
                <a
                  href="https://discord.gg/CNPfhWpcAa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200 relative group"
                  aria-label="Join our Discord"
                >
                  <IconBrandDiscord size={20} stroke={1.5} />
                  <div className="absolute -inset-2 bg-yellow-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>

                {/* GitHub */}
                <a
                  href="https://github.com/opral/monorepo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200 relative group"
                  aria-label="View on GitHub"
                >
                  <IconBrandGithub size={20} stroke={1.5} />
                  <div className="absolute -inset-2 bg-yellow-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>

                {/* Lix link */}
                <a
                  href="https://lix.opral.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200 relative group"
                  aria-label="Visit Lix"
                >
                  <LixIcon size={20} className="text-current" />
                  <div className="absolute -inset-2 bg-yellow-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              </div>
              
              {/* Join waitlist button */}
              <a
                href="#waitlist-form"
                className="glassmorphic px-5 py-2 text-sm text-white border border-white/10 hover:border-yellow-primary/30 transition-all duration-300 group inline-flex animated-border"
                onClick={(e) => {
                  e.preventDefault();
                  // Scroll to the waitlist form
                  document.getElementById("waitlist-form")?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });

                  // Focus the input field after scrolling is complete
                  setTimeout(() => {
                    const emailInput = document.getElementById(
                      "waitlist-email-input"
                    ) as HTMLInputElement;
                    if (emailInput) {
                      emailInput.focus();
                      // Optional: move cursor to end of any existing text
                      const length = emailInput.value.length;
                      emailInput.setSelectionRange(length, length);
                    }
                  }, 1000); // Delay to allow smooth scrolling to complete
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>Join the waitlist</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-yellow-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[16px]"></div>
              </a>
            </div>
          </div>
          
          {/* Mobile layout */}
          <div className="flex flex-col md:hidden">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <div className="flex justify-center">
              <a
                href="#waitlist-form"
                className="glassmorphic px-5 py-2 text-sm text-white border border-white/10 hover:border-yellow-primary/30 transition-all duration-300 group inline-flex animated-border"
                onClick={(e) => {
                  e.preventDefault();
                  // Scroll to the waitlist form
                  document.getElementById("waitlist-form")?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });

                  // Focus the input field after scrolling is complete
                  setTimeout(() => {
                    const emailInput = document.getElementById(
                      "waitlist-email-input"
                    ) as HTMLInputElement;
                    if (emailInput) {
                      emailInput.focus();
                      // Optional: move cursor to end of any existing text
                      const length = emailInput.value.length;
                      emailInput.setSelectionRange(length, length);
                    }
                  }, 1000); // Delay to allow smooth scrolling to complete
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>Join the waitlist</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-yellow-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[16px]"></div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Hero content */}
      <div className="max-w-3xl mx-auto text-center z-10 flex-1 flex flex-col justify-center py-12">
        <h1
          className={`text-5xl md:text-6xl font-semibold mb-8 yellow-glow-text transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          Write like never before.
        </h1>

        <p
          className={`text-base md:text-lg text-gray-300 mb-10 max-w-2xl mx-auto transition-all duration-1000 delay-300 flex flex-wrap items-center justify-center gap-x-3 gap-y-4 ${
            isVisible
              ? "opacity-100 translate-y-0 blur-none"
              : "opacity-0 translate-y-10 blur-sm"
          }`}
        >
          {/* AI Feature */}
          <span className="flex items-center">
            <span className="relative inline-flex items-center">
              <span className="relative px-2 py-0.5">
                <span className="relative z-10 font-semibold flex items-center gap-1">
                  <Sparkles size={16} className="text-yellow-primary mr-1" />
                  <span className="text-yellow-primary font-medium">AI</span>
                </span>
                <span
                  className="absolute inset-0 bg-gradient-to-br from-yellow-primary/20 to-yellow-primary/5 rounded-md border border-yellow-primary/30 blur-[0.5px] ai-highlight"
                  style={{ zIndex: -1 }}
                ></span>
              </span>
            </span>
            <span className="ml-1">-powered writing</span>
          </span>

          <span className="text-gray-500 mx-2 hidden md:inline">•</span>

          {/* Change Control Feature */}
          <span className="flex items-center">
            <span>Built-in</span>
            <span className="relative inline-flex items-center mx-1">
              <span className="relative px-2 py-0.5">
                <span className="relative z-10 font-semibold flex items-center gap-1">
                  <LixIcon size={16} className="text-[#08B5D6] mr-0.5" />
                  <span>
                    <span className="text-green-400">change</span>
                    <span className="text-red-400 line-through opacity-70 mx-1">
                      tracking
                    </span>
                    <span className="text-green-400">control</span>
                  </span>
                </span>
                <span
                  className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-400/5 rounded-md border border-green-400/30 blur-[0.5px] track-highlight"
                  style={{ zIndex: -1 }}
                ></span>
              </span>
            </span>
          </span>

          <span className="text-gray-500 mx-2 hidden md:inline">•</span>

          {/* Markdown Feature */}
          <span className="flex items-center">
            <span>Everything</span>
            <span className="relative inline-flex items-center mx-1">
              <span className="relative px-2 py-0.5">
                <span className="relative z-10 font-semibold flex items-center gap-1">
                  <svg
                    className="w-4 h-4 mr-0.5"
                    fill="none"
                    viewBox="0 0 208 128"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g fill="currentColor">
                      <path
                        clipRule="evenodd"
                        d="m15 10c-2.7614 0-5 2.2386-5 5v98c0 2.761 2.2386 5 5 5h178c2.761 0 5-2.239 5-5v-98c0-2.7614-2.239-5-5-5zm-15 5c0-8.28427 6.71573-15 15-15h178c8.284 0 15 6.71573 15 15v98c0 8.284-6.716 15-15 15h-178c-8.28427 0-15-6.716-15-15z"
                        fillRule="evenodd"
                      />
                      <path d="m30 98v-68h20l20 25 20-25h20v68h-20v-39l-20 25-20-25v39zm125 0-30-33h20v-35h20v35h20z" />
                    </g>
                  </svg>
                  <span className="text-white">Markdown</span>
                </span>
                <span
                  className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-md border border-white/20 blur-[0.5px] markdown-highlight"
                  style={{ zIndex: -1 }}
                ></span>
              </span>
            </span>
            <span>should be</span>
          </span>
        </p>

        {/* Prompt Input UI */}
        <div
          className={`transition-all duration-1000 delay-500 relative ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <PromptInput
            externalPrompt={selectedPrompt}
            onPromptSelected={handlePromptAnimationComplete}
          />

          {/* Prompt Pills */}
          <div
            className={`transition-all duration-700 delay-[1500ms] ${
              pillsVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-5"
            }`}
          >
            <PromptPills onSelectPrompt={handlePromptSelected} />
          </div>

          {/* Additional glow effect beneath prompt input */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[200px] h-[80px] bg-yellow-primary/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
