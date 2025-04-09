import { useState, useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { PlateElementProps } from '@udecode/plate/react';
import { activeFileAtom } from '@/state-active-file';
import { ExtendedMarkdownPlugin } from './plugins/markdown/markdown-plugin';
import { useChat } from './use-chat';
import { toast } from 'sonner';
import { Button } from '../plate-ui/button';
import { Loader2, Zap } from 'lucide-react';

export function EmptyDocumentPromptElement({
  attributes,
  editor
}: PlateElementProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFile] = useAtom(activeFileAtom);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chat = useChat({
    streamProtocol: "text",
    onResponse: async (res) => {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
        applyMdContent(result); // apply progressively or buffer chunks
      }
    },
    onFinish: () => {
      if (isGenerating) {
        setIsGenerating(false);
        setPrompt('');
      }
    }
  });

  const applyMdContent = (content: string) => {
    const nodes = editor.getApi(ExtendedMarkdownPlugin).markdown.deserialize(content);
    editor.tf.setValue(nodes);
  };
  
  // Adjust textarea height when content changes
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  // Initialize height and reset on changes
  useEffect(() => {
    adjustHeight();
  }, [prompt]);

  // Handle document generation
  const handleGenerateDocument = async () => {
    if (!activeFile || !prompt.trim()) return;
    setIsGenerating(true);

    try {
      await chat.append({
        role: 'user',
        content: `Generate a complete, well-structured markdown document about: ${prompt}. Include appropriate headings starting with level 1 heading (#), paragraphs, and relevant formatting like lists or emphasis where appropriate.`,
      });
    } catch (error) {
      console.error('Error starting document generation:', error);
      toast.error("Failed to generate document. Please try again.");
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow line break with Shift+Enter
        return;
      }
      // Prevent default to avoid form submission
      e.preventDefault();

      // Submit if not already generating
      if (!isGenerating && prompt.trim() && !chat.isLoading) {
        handleGenerateDocument();
      }
    }
  };

  return (
    <div {...attributes} contentEditable={false}>
      <form
        className="my-8 flex flex-col items-end justify-center w-full p-1 gap-2 border border-muted rounded-md focus-within:ring-1"
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerateDocument();
        }}
      >
        <textarea
          ref={textareaRef}
          autoFocus
          id="prompt"
          className="w-full min-h-8 p-3 border-none focus:outline-none resize-none overflow-hidden"
          placeholder="What do you want to write?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="submit"
          disabled={isGenerating || !prompt.trim() || chat.isLoading}
        >
          {isGenerating ?
            (<>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
            ) :
            (<>
              <Zap className="h-4 w-4" />
              Generate
            </>
            )
          }
        </Button>
      </form>
    </div>
  );
}