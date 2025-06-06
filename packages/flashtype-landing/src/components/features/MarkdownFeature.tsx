import { useState, useEffect, useRef } from "react";
import { FileText, Code } from "lucide-react";

// Sample markdown document with more examples
const markdownSample = `# Document Title

## Subheading

**Bold text** and *italic text*

> Blockquote with important information

\`\`\`js
// Code block with syntax highlighting
function example() {
  return "Hello world!";
}
\`\`\`

- List item with [link](https://example.com)
- Another item with ![image](image.jpg)
`;

// Beautiful WYSIWYG rendered HTML version
const renderedHTML = `
<h1 class="text-xl font-bold mb-3 text-white/95">Creating Great Documentation</h1>
<h2 class="text-lg font-semibold mb-2 text-white/90">Key Elements to Include</h2>

<p class="mb-3 leading-relaxed">Effective documentation should include <strong class="text-white/90">clear examples</strong> and <em class="text-gray-300">detailed explanations</em> for your users.</p>

<blockquote class="border-l-2 border-white/30 pl-4 py-1 my-4 text-white/80 italic bg-white/5 rounded-r">
  Thoughtful documentation is the foundation of a great user experience.
</blockquote>

<div class="mb-3">
  <div class="flex items-center text-sm text-white/90 mb-1.5 bg-white/10 py-1 px-2 rounded">
    <svg class="w-4 h-4 mr-2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
    </svg>
    <span>Benefits of using our platform:</span>
  </div>
  <ul class="list-disc pl-5 space-y-1 text-white/80">
    <li>Seamless integration with <a href="#" class="text-white/90 hover:underline">existing tools</a></li>
    <li>Real-time collaboration features</li>
    <li>Automated workflow capabilities</li>
  </ul>
</div>
`;

const MarkdownFeature = () => {
  const [isRendered, setIsRendered] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [autoSwitch, setAutoSwitch] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);

  // Add a typing effect to simulate real usage
  const [currentIndex, setCurrentIndex] = useState(0);
  const typingSpeed = 80; // ms per character

  // Split the markdown into visible (typed) and remaining parts
  const visibleMarkdown = markdownSample.slice(0, currentIndex);
  const remainingMarkdown = markdownSample.slice(currentIndex);

  // Auto-switch between markdown and preview
  useEffect(() => {
    if (isHovering && autoSwitch) {
      const switchTimer = setInterval(() => {
        setIsRendered((prev) => !prev);
      }, 3000);

      return () => clearInterval(switchTimer);
    }
  }, [isHovering, autoSwitch]);

  // Typing effect
  useEffect(() => {
    if (isHovering && currentIndex < markdownSample.length) {
      const typingTimer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(typingTimer);
    }
  }, [isHovering, currentIndex]);

  // Handle tab click
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    // Now "preview" means source code view, "editor" means WYSIWYG
    setIsRendered(tab === "preview");
    setAutoSwitch(false);
  };

  // Monochrome markdown syntax highlighter
  const highlightMarkdown = (code: string) => {
    // Replace specific patterns with styled spans - using only white/gray
    return code
      .replace(/(^# .+$)/gm, '<span class="text-white">$1</span>')
      .replace(/(^## .+$)/gm, '<span class="text-white/80">$1</span>')
      .replace(/(\*\*.*?\*\*)/g, '<span class="text-white/90">$1</span>')
      .replace(/(\*.+?\*)/g, '<span class="text-white/80">$1</span>')
      .replace(/(\`\`\`.+?\`\`\`)/gs, '<span class="text-white/70">$1</span>')
      .replace(/(^>.*$)/gm, '<span class="text-gray-400">$1</span>')
      .replace(/(\[.*?\]\(.*?\))/g, '<span class="text-white/80">$1</span>')
      .replace(/(^-.*$)/gm, '<span class="text-gray-300">$1</span>');
  };

  return (
    <div
      className="glassmorphic p-7 h-full hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative z-10">
        {/* Simple title with markdown logo */}
        <h3 className="text-xl font-semibold mb-6 text-center flex justify-center items-center">
          <svg
            className="w-5 h-5 mr-2"
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
          <span>Markdown with Plate.js</span>
        </h3>

        {/* Simple Editor */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 shadow-lg">
          {/* Tab navigation - minimal */}
          <div className="flex border-b border-white/10 bg-black/20">
            <button
              className={`px-4 py-2 text-xs ${
                activeTab === "editor"
                  ? "text-white border-b border-white/50"
                  : "text-gray-400"
              }`}
              onClick={() => handleTabClick("editor")}
            >
              <FileText size={12} className="inline mr-1" />
              Editor
            </button>
            <button
              className={`px-4 py-2 text-xs ${
                activeTab === "preview"
                  ? "text-white border-b border-white/50"
                  : "text-gray-400"
              }`}
              onClick={() => handleTabClick("preview")}
            >
              <Code size={12} className="inline mr-1" />
              Source
            </button>
          </div>

          {/* Content area with WYSIWYG and source view */}
          <div className="relative">
            {/* WYSIWYG editor */}
            <div
              className={`transition-all duration-500 p-4 w-full ${
                !isRendered ? "opacity-100" : "opacity-0"
              }`}
              style={{ height: "220px", overflowY: "auto" }}
            >
              {/* Subtle formatting toolbar */}
              <div className="flex items-center mb-2 space-x-1 pb-2 border-b border-white/5">
                <div className="p-1 rounded bg-white/20 text-white/70">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 12h12M6 18h12M4 6h16" />
                  </svg>
                </div>
                {[
                  "text-white/60",
                  "text-white/60",
                  "text-white/60",
                  "text-white/60",
                ].map((color, i) => (
                  <div
                    key={i}
                    className={`p-1 rounded hover:bg-white/5 ${color}`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d={
                          i === 0
                            ? "M17 7l-10 10M7 7l10 10"
                            : i === 1
                            ? "M10 6H6v4M18 6h-4v4M6 14v4h4M14 14v4h4"
                            : i === 2
                            ? "M9 9h6M15 4v16M9 4v16"
                            : "M3 7h18M3 11h18M3 15h18M3 19h18"
                        }
                      />
                    </svg>
                  </div>
                ))}
              </div>

              {/* Render the HTML with proper styles */}
              <div className="text-white text-sm markdown-preview prose prose-invert max-w-none relative">
                <div dangerouslySetInnerHTML={{ __html: renderedHTML }}></div>

                {/* Fake cursor in WYSIWYG mode */}
                {!isRendered && isHovering && (
                  <div className="absolute top-[130px] left-[455px] inline-block w-[2px] h-[16px] bg-white animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Source code view */}
            <div
              ref={editorRef}
              className={`absolute inset-0 transition-all duration-500 p-4 w-full ${
                isRendered ? "opacity-100" : "opacity-0"
              }`}
              style={{ height: "220px", overflowY: "auto" }}
            >
              <pre className="text-gray-300 font-mono text-xs leading-relaxed">
                <code
                  dangerouslySetInnerHTML={{
                    __html: highlightMarkdown(visibleMarkdown),
                  }}
                ></code>
                {/* Cursor effect */}
                {currentIndex < markdownSample.length && (
                  <span className="bg-white/50 inline-block w-[2px] h-[14px] animate-pulse"></span>
                )}
                <code className="opacity-20">{remainingMarkdown}</code>
              </pre>
            </div>
          </div>

          {/* Minimal status bar */}
          <div className="border-t border-white/10 bg-black/30 py-1 px-3 text-[10px] text-gray-400 flex justify-between">
            <div className="flex items-center">
              <span>Markdown Editor</span>
            </div>
            <div className="flex items-center">
              <span>Real-time collaboration</span>
            </div>
          </div>
        </div>

        {/* Feature list with shortcuts */}
        <div className="mt-4">
          {/* Main features - styled as pills */}
          <div className="flex justify-around text-center mb-5">
            <div className="text-gray-300 text-xs px-3 py-1 bg-white/5 rounded-full border border-white/10">
              Rich Editing
            </div>
            <div className="text-gray-300 text-xs px-3 py-1 bg-white/5 rounded-full border border-white/10">
              Collaboration
            </div>
            <div className="text-gray-300 text-xs px-3 py-1 bg-white/5 rounded-full border border-white/10">
              Markdown Support
            </div>
          </div>

          {/* User benefits from Plate.js with descriptions */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-white/70 bg-white/5 py-2 px-3 rounded border border-white/10">
            <div className="flex items-start">
              <div className="bg-white/10 p-1 mr-1.5 rounded-sm flex-shrink-0 mt-0.5">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              </div>
              <div>
                <div className="font-medium">Focus on Content</div>
                <div className="text-gray-400">
                  Write without format distractions
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white/10 p-1 mr-1.5 rounded-sm flex-shrink-0 mt-0.5">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </div>
              <div>
                <div className="font-medium">Work Anywhere</div>
                <div className="text-gray-400">
                  Export to any markdown platform
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white/10 p-1 mr-1.5 rounded-sm flex-shrink-0 mt-0.5">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <div className="font-medium">Write Together</div>
                <div className="text-gray-400">
                  Real-time team collaboration
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white/10 p-1 mr-1.5 rounded-sm flex-shrink-0 mt-0.5">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              </div>
              <div>
                <div className="font-medium">Write Faster</div>
                <div className="text-gray-400">
                  Inline @-commands & shortcuts
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white/10 p-1 mr-1.5 rounded-sm flex-shrink-0 mt-0.5">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </div>
              <div>
                <div className="font-medium">Customizable</div>
                <div className="text-gray-400">Tailored to your workflow</div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white/10 p-1 mr-1.5 rounded-sm flex-shrink-0 mt-0.5">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <path d="M8.5 10.5l2.5 3 3.5-4.5 4.5 6H5.5l3-4z"></path>
                </svg>
              </div>
              <div>
                <div className="font-medium">Rich Media</div>
                <div className="text-gray-400">
                  Images and interactive content
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownFeature;
