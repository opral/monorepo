import { useState, useEffect, useRef, useCallback } from 'react';
import { CornerDownLeft } from 'lucide-react';

const PLACEHOLDER_TEXTS = [
  "Write a blog post about AI and creativity...",
  "Explain quantum computing for beginners...",
  "Create a press release for our new product...",
  "Draft a detailed project timeline..."
];

interface PromptInputProps {
  externalPrompt?: string;
  onPromptSelected?: () => void;
}

const PromptInput = ({ externalPrompt, onPromptSelected }: PromptInputProps) => {
  const [placeholder, setPlaceholder] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isAnimatingExternalPrompt, setIsAnimatingExternalPrompt] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle external prompt coming from the pills
  useEffect(() => {
    if (externalPrompt && externalPrompt !== inputValue) {
      setIsAnimatingExternalPrompt(true);
      setInputValue('');
      
      // Reset the typing animation
      setCharIndex(0);
      setIsDeleting(false);
      
      // Animate typing the external prompt
      let index = 0;
      const interval = setInterval(() => {
        if (index <= externalPrompt.length) {
          setInputValue(externalPrompt.substring(0, index));
          index++;
        } else {
          clearInterval(interval);
          setIsAnimatingExternalPrompt(false);
          if (onPromptSelected) onPromptSelected();
          // Focus the input after animation completes
          if (inputRef.current) inputRef.current.focus();
        }
      }, 30);
      
      return () => clearInterval(interval);
    }
  }, [externalPrompt, onPromptSelected]);

  // Regular placeholder animation
  useEffect(() => {
    // Skip placeholder animation when external prompt is being animated
    if (isAnimatingExternalPrompt) return;
    
    const typingSpeed = isDeleting ? 30 : 70;
    
    const typeCharacter = () => {
      const currentText = PLACEHOLDER_TEXTS[textIndex];
      
      if (!isDeleting && charIndex < currentText.length) {
        setPlaceholder(currentText.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else if (!isDeleting && charIndex >= currentText.length) {
        // Start deleting after a pause
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && charIndex > 0) {
        setPlaceholder(currentText.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setTextIndex((textIndex + 1) % PLACEHOLDER_TEXTS.length);
      }
    };
    
    const timer = setTimeout(typeCharacter, typingSpeed);
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex, isAnimatingExternalPrompt]);
  
  const handleFocus = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    alert(`Submitted prompt: ${inputValue}`);
    setInputValue('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Glassmorphic bar */}
      <div 
        onClick={handleFocus}
        className="glassmorphic relative p-4 flex items-center cursor-text group"
      >
        <div className="absolute inset-0 yellow-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <input
          ref={inputRef}
          type="text"
          className="w-full bg-transparent outline-none text-white placeholder-gray-400"
          placeholder={isAnimatingExternalPrompt ? '' : placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        
        {/* Enter button */}
        <button 
          onClick={handleSubmit}
          disabled={inputValue.trim() === ''}
          className={`flex items-center justify-center ml-2 p-2 rounded-full transition-all duration-200 ${
            inputValue.trim() !== '' 
              ? 'text-yellow-primary bg-yellow-primary/10 hover:bg-yellow-primary/20' 
              : 'text-gray-500 bg-transparent cursor-not-allowed'
          }`}
        >
          <CornerDownLeft size={18} />
        </button>
      </div>
    </div>
  );
};

export default PromptInput;