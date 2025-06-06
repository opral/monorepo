import { useState, useEffect, useRef } from "react";
import { Sparkles, Zap, Brain, Cpu } from "lucide-react";
import FlashIcon from "../FlashIcon";

const AIFeature = () => {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [animateBackground, setAnimateBackground] = useState(false);
  const fullText =
    "Flashtype's AI understands context and generates high-quality content while maintaining your unique style and voice.";

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-start typing animation after a delay
    const timer = setTimeout(() => {
      if (!isTyping) {
        handleStartTyping();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isTyping && text.length < fullText.length) {
      const timeout = setTimeout(() => {
        setText(fullText.slice(0, text.length + 1));
      }, 40); // Slightly faster typing

      return () => clearTimeout(timeout);
    }

    if (text.length === fullText.length) {
      // Show pulse animation when typing is complete
      setTimeout(() => {
        setShowPulse(true);
      }, 300);
    }
  }, [text, isTyping]);

  const handleStartTyping = () => {
    if (!isTyping) {
      setText("");
      setIsTyping(true);
      setShowPulse(false);
      setAnimateBackground(true);

      // Reset animation background after some time
      setTimeout(() => {
        setAnimateBackground(false);
      }, 2000);
    }
  };

  // Model switching functionality removed

  return (
    <div
      ref={containerRef}
      className="glassmorphic p-7 h-full hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
      onMouseEnter={handleStartTyping}
    >
      {/* Enhanced animated background */}
      <div
        className={`absolute inset-0 bg-gradient-conic from-yellow-primary/20 via-pink-500/10 to-transparent ${
          animateBackground
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        } transition-opacity duration-300 animate-slow-rotate`}
      ></div>

      <div className="relative z-10">
        {/* Enhanced title with sparkle icon */}
        <h3 className="text-xl font-semibold mb-6 text-center flex justify-center items-center">
          <span className="relative inline-flex items-center">
            <span className="relative px-2 py-0.5 mr-1">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-primary/20 to-yellow-primary/5 rounded-md border border-yellow-primary/30 blur-[0.5px]"></div>
              <div className="flex items-center">
                <Sparkles
                  size={18}
                  className="text-yellow-primary mr-1 animate-pulse-slow"
                />
                <span className="relative z-10 font-bold text-yellow-primary">
                  AI
                </span>
              </div>
              <span className="absolute inset-0 bg-gradient-to-br from-yellow-primary/20 to-yellow-primary/5 rounded-md border border-yellow-primary/30 blur-[0.5px] ai-highlight"></span>
            </span>
          </span>
          -Powered
        </h3>

        {/* AI providers badge */}
        <div className="flex justify-center mb-4">
          <div className="flex bg-black/20 rounded-full px-3 py-1.5 text-xs items-center">
            <span className="text-gray-400 mr-1">Powered by</span>
            <span className="text-yellow-primary mx-1 font-medium">GPT-4o</span>
            <span className="text-gray-500 mx-1">|</span>
            <span className="text-gray-400 mx-1">Claude 4</span>
            <span className="text-gray-500 mx-1">|</span>
            <span className="text-gray-400 mx-1">Gemini</span>
          </div>
        </div>

        <div className="mb-6 text-gray-300">
          {/* AI writing assistant UI */}
          <div className="border border-white/10 rounded-xl p-0 bg-black/40 relative overflow-hidden mb-5 shadow-lg">
            {/* Editor-like header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/30">
              <div className="flex items-center">
                <FlashIcon size={16} className="text-yellow-primary mr-2" />
                <span className="text-xs font-medium text-white/90">
                  Flashtype Chat
                </span>
              </div>
              <div className="flex items-center">{/* AI badge removed */}</div>
            </div>

            {/* Document editor-like area with subtle grid background */}
            <div className="px-4 py-3 max-h-[180px] overflow-y-auto relative">
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              ></div>

              {/* Prompt area with slash command styling */}
              <div className="mb-4">
                <div className="flex items-center mb-1">
                  <span className="text-xs text-yellow-primary font-medium">
                    Prompt
                  </span>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm">
                  <span className="text-gray-300">
                    Write a paragraph about AI writing assistants
                  </span>
                </div>
              </div>

              {/* AI response with code-like styling */}
              <div className="mb-2">
                <div className="flex items-center mb-1">
                  <span className="text-xs text-yellow-primary font-medium">
                    AI Response
                  </span>
                  {isTyping && (
                    <div className="ml-2 flex space-x-1 items-center">
                      <div className="w-1 h-1 rounded-full bg-yellow-primary/70 animate-pulse"></div>
                      <div className="w-1 h-1 rounded-full bg-yellow-primary/70 animate-pulse delay-100"></div>
                      <div className="w-1 h-1 rounded-full bg-yellow-primary/70 animate-pulse delay-200"></div>
                    </div>
                  )}
                </div>
                <div className="bg-yellow-primary/5 border border-yellow-primary/10 rounded-lg p-2.5 text-sm relative">
                  {isTyping ? (
                    <span
                      className={`${text.length === 0 ? "typing-cursor" : ""}`}
                    >
                      {text}
                      {text.length > 0 && text.length < fullText.length && (
                        <span className="typing-cursor"></span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      Click to see AI typing...
                    </span>
                  )}

                  {/* Visual processing indicator */}
                  {showPulse && (
                    <div className="absolute -right-1 -bottom-1 p-1 bg-black/40 rounded-full">
                      <Zap size={10} className="text-yellow-primary" />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions removed */}
            </div>

            {/* Simplified input area */}
            <div className="border-t border-white/5 p-3 bg-black/20">
              <div className="flex items-center">
                <div className="flex-1 bg-black/30 rounded-md px-3 py-1.5 text-xs text-gray-400 border border-white/5">
                  Ask AI to write, edit, or expand...
                </div>
              </div>
            </div>
          </div>

          {/* Model info with brain icon */}
          <div className="flex justify-between text-xs mb-3 items-center">
            <div className="text-yellow-primary/80 flex items-center">
              <Brain size={14} className="mr-1.5" />
              <span>Contextual AI</span>
            </div>
            <div className="flex items-center text-gray-400 bg-black/30 px-2 py-1 rounded-full border border-white/5">
              <Cpu size={10} className="mr-1.5 text-yellow-primary/70" />
              <span>Advanced LLM technology</span>
            </div>
          </div>

          {/* Enhanced features list with yellow highlight on hover */}
          <div className="bg-black/20 rounded-lg p-4 border border-white/5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>

            <div className="text-xs text-gray-300 font-medium mb-3 flex items-center">
              <Sparkles size={12} className="mr-2 text-yellow-primary" />
              <span>Powerful AI features:</span>
            </div>
            <ul className="text-xs text-gray-400 space-y-2 relative z-10">
              <li className="flex items-start group/feature hover:bg-black/20 p-1 rounded transition-colors">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="mr-2 mt-0.5 text-yellow-primary/80 group-hover/feature:text-yellow-primary transition-colors"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="group-hover/feature:text-white transition-colors">
                  Inline suggestions as you type
                </span>
              </li>
              <li className="flex items-start group/feature hover:bg-black/20 p-1 rounded transition-colors">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="mr-2 mt-0.5 text-yellow-primary/80 group-hover/feature:text-yellow-primary transition-colors"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="group-hover/feature:text-white transition-colors">
                  Inline prompting with @-commands
                </span>
              </li>
              <li className="flex items-start group/feature hover:bg-black/20 p-1 rounded transition-colors">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="mr-2 mt-0.5 text-yellow-primary/80 group-hover/feature:text-yellow-primary transition-colors"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="group-hover/feature:text-white transition-colors">
                  Predefined actions (summarize, expand, refine)
                </span>
              </li>
              <li className="flex items-start group/feature hover:bg-black/20 p-1 rounded transition-colors">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="mr-2 mt-0.5 text-yellow-primary/80 group-hover/feature:text-yellow-primary transition-colors"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="group-hover/feature:text-white transition-colors">
                  Smart context-aware writing assistance
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFeature;
