import { Zap } from 'lucide-react';

interface PromptPillsProps {
  onSelectPrompt: (prompt: string) => void;
}

const PromptPills = ({ onSelectPrompt }: PromptPillsProps) => {
  const examplePrompts = [
    "Write a product announcement",
    "Draft a blog post outline",
    "Explain a technical concept"
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      {examplePrompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onSelectPrompt(prompt)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 
                    rounded-full text-sm text-gray-300 transition-all duration-300 
                    hover:border-yellow-primary/20 hover:text-white group"
        >
          <Zap size={14} className="text-white/40 group-hover:text-yellow-primary/80 transition-colors duration-300" />
          <span>{prompt}</span>
        </button>
      ))}
    </div>
  );
};

export default PromptPills;