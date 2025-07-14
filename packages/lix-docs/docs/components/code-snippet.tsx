import { useState, useEffect, useMemo } from "react";
import { bundledLanguages, createHighlighter, type Highlighter } from 'shiki';

// Global highlighter instance
let highlighterPromise: Promise<Highlighter> | null = null;

// Get or create the highlighter
async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: Object.keys(bundledLanguages),
    });
  }
  return highlighterPromise;
}

// Pure code block component with syntax highlighting
interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

function CodeBlock({
  code,
  language = "typescript",
  showLineNumbers = false,
}: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");

  // Highlight code on mount and when code changes
  useEffect(() => {
    let cancelled = false;

    const highlight = async () => {
      try {
        const highlighter = await getHighlighter();

        if (cancelled) return;

        const html = highlighter.codeToHtml(code, {
          lang: language,
          theme: "github-light",
          transformers: showLineNumbers
            ? [
                {
                  line(node: any, line: number) {
                    if (node.properties) {
                      node.properties["data-line"] = String(line);
                    }
                    return node;
                  },
                },
              ]
            : [],
        });

        setHighlightedHtml(html);
      } catch (error) {
        console.error("Failed to highlight code:", error);
        setHighlightedHtml(`<pre><code>${escapeHtml(code)}</code></pre>`);
      }
    };

    highlight();

    return () => {
      cancelled = true;
    };
  }, [code, language, showLineNumbers]);

  // Show plain code initially for SSR, then enhanced version after hydration
  const displayHtml =
    highlightedHtml || `<pre><code>${escapeHtml(code)}</code></pre>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
      <div
        className="overflow-x-auto p-4 [&_pre]:!bg-transparent [&_pre]:!p-0"
        dangerouslySetInnerHTML={{ __html: displayHtml }}
        style={{
          whiteSpace: "pre",
          wordWrap: "normal",
          fontSize: "14px",
        }}
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          title="Copy code"
          onClick={handleCopy}
          className="p-1.5 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          {!isCopied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-7 0c.55 0 1 .45 1 1s-.45 1-1 1s-1-.45-1-1s.45-1 1-1m7 16H5V5h2v3h10V5h2z"
              ></path>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#22c55e"
                d="m9 16.17l-4.17-4.17l-1.42 1.41L9 19L21 7l-1.41-1.41z"
              ></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function escapeHtml(code: string): string {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Format console output as JavaScript-like code
function formatConsoleOutput(
  outputs: Array<{
    level: string;
    args: Array<{ type: string; content: string }>;
    timestamp: string;
    section?: string;
  }>
): string {
  return outputs
    .map((entry) => {
      const prefix = entry.level !== "log" ? `// ${entry.level.toUpperCase()}: ` : "";
      const content = entry.args.map((arg) => arg.content).join(" ");
      return prefix + content;
    })
    .join("\n\n");
}

interface CodeSnippetProps {
  module: any;
  srcCode: string;
  sections?: string[];
}

// Helper function to dedent a block of code
function dedentCode(code: string): string {
  const lines = code.split("\n");
  // Find the minimum indentation (excluding empty lines)
  const minIndent = lines
    .filter((line) => line.trim().length > 0)
    .reduce((min, line) => {
      const match = line.match(/^(\s*)/);
      const indent = match ? match[1].length : 0;
      return Math.min(min, indent);
    }, Infinity);

  // Remove the common indentation from all lines
  if (minIndent === Infinity || minIndent === 0) return code;

  return lines.map((line) => line.slice(minIndent)).join("\n");
}

// Function to parse sections from code
function parseSections(code: string): {
  sections: Record<string, string>;
  imports: string;
  fullCode: string;
  sectionRanges: Record<string, { start: number; end: number }>;
} {
  const sections: Record<string, string> = {};
  const sectionRanges: Record<string, { start: number; end: number }> = {};
  const lines = code.split("\n");
  const importLines: string[] = [];

  let currentSection: string | null = null;
  let sectionContent: string[] = [];
  let inSection = false;
  let sectionStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for section start
    if (line.includes("SECTION-START")) {
      const match = line.match(/SECTION-START\s*"([^"]+)"/);
      if (match) {
        currentSection = match[1];
        sectionContent = [];
        inSection = true;
        sectionStartLine = i + 1; // Next line after SECTION-START
        continue;
      }
    }

    // Check for section end
    if (line.includes("SECTION-END")) {
      if (currentSection && sectionContent.length > 0) {
        // Dedent the section content to remove function-level indentation
        sections[currentSection] = dedentCode(sectionContent.join("\n"));
        sectionRanges[currentSection] = { start: sectionStartLine, end: i - 1 };
      }
      currentSection = null;
      inSection = false;
      continue;
    }

    // Collect imports (before any section)
    if (!inSection && line.match(/^import\s+/)) {
      importLines.push(line);
    }

    // Add to current section
    if (inSection && currentSection) {
      sectionContent.push(line);
    }
  }

  // Create full code without section markers and function wrapper
  const fullCode = lines
    .filter(
      (line) => !line.includes("SECTION-START") && !line.includes("SECTION-END")
    )
    .filter((line) => !line.includes("export default async function"))
    .filter((line) => !line.match(/^}$/)) // Remove closing brace of function
    .join("\n")
    .trim();

  return { sections, imports: importLines.join("\n"), fullCode, sectionRanges };
}

// Function to combine selected sections with necessary setup code
function combineSections(
  allSections: Record<string, string>,
  selectedSections?: string[]
): string {
  if (!selectedSections || selectedSections.length === 0) {
    return Object.values(allSections).join("\n\n");
  }

  // Show only the selected sections
  return selectedSections
    .map((sectionName) => allSections[sectionName])
    .filter(Boolean)
    .join("\n\n");
}

// Function to get all prerequisite code (imports + previous sections)
function getPrerequisiteCode(
  allSections: Record<string, string>,
  selectedSections: string[],
  imports: string
): string {
  const sectionNames = Object.keys(allSections);
  const firstSelectedIndex = Math.min(
    ...selectedSections.map((s) => sectionNames.indexOf(s))
  );

  const prerequisiteSections = sectionNames
    .slice(0, firstSelectedIndex)
    .map((name) => allSections[name])
    .filter(Boolean)
    .join("\n\n");

  return [imports, prerequisiteSections].filter(Boolean).join("\n\n");
}


export default function CodeSnippet({
  module,
  srcCode,
  sections,
}: CodeSnippetProps) {
  const [setupExpanded, setSetupExpanded] = useState(false);
  const [outputExpanded, setOutputExpanded] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<
    Array<{
      level: string;
      args: Array<{ type: string; content: string }>;
      timestamp: string;
      section?: string;
    }>
  >([]);

  // Parse the source code to extract sections and setup
  const { sections: allSections, imports } = parseSections(srcCode);
  const currentCode = combineSections(allSections, sections);
  const prerequisiteCode = sections
    ? getPrerequisiteCode(allSections, sections, imports)
    : "";

  const executeCode = async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    setConsoleOutput([]);
    setHasExecuted(true);

    try {
      const outputs: Array<{
        level: string;
        args: Array<{ type: string; content: string }>;
        timestamp: string;
        section?: string;
      }> = [];

      const logOutput = (
        level: string,
        section: string | undefined,
        ...args: any[]
      ) => {
        const formattedArgs = args.map((arg: any) => {
          if (typeof arg === "object" && arg !== null) {
            return {
              type: "object",
              content: JSON.stringify(arg, null, 2),
            };
          }
          return {
            type: "primitive",
            content: String(arg),
          };
        });

        outputs.push({
          level,
          args: formattedArgs,
          timestamp: new Date().toLocaleTimeString(),
          section,
        });
      };

      try {
        if (module.default && typeof module.default === "function") {
          // If no sections specified, run everything normally
          if (!sections || sections.length === 0) {
            const mockConsole = {
              log: (...args: any[]) => logOutput("log", undefined, ...args),
              warn: (...args: any[]) => logOutput("warn", undefined, ...args),
              error: (...args: any[]) => logOutput("error", undefined, ...args),
              info: (...args: any[]) => logOutput("info", undefined, ...args),
            };
            await module.default(mockConsole);
          } else {
            // Execute only selected sections by creating a custom function
            const selectedSectionCode = sections
              .filter(sectionName => allSections[sectionName])
              .map(sectionName => allSections[sectionName])
              .join('\n\n');

            if (selectedSectionCode.trim()) {
              // Create a simple function that executes just the selected sections
              const functionCode = `
                ${imports}
                
                const mockConsole = arguments[0];
                const moduleExports = arguments[1] || {};
                const { openLix } = moduleExports;
                
                (async () => {
                  try {
                    ${allSections[Object.keys(allSections)[0]] ? 'const lix = await openLix({});' : ''}
                    
                    // Replace console with mockConsole in the section code
                    const console = mockConsole;
                    
                    ${selectedSectionCode}
                  } catch (error) {
                    mockConsole.error('Error in section execution:', error);
                  }
                })();
              `;

              try {
                const mockConsole = {
                  log: (...args: any[]) => logOutput("log", undefined, ...args),
                  warn: (...args: any[]) => logOutput("warn", undefined, ...args),
                  error: (...args: any[]) => logOutput("error", undefined, ...args),
                  info: (...args: any[]) => logOutput("info", undefined, ...args),
                };

                // Execute the selected sections code
                const executeFunction = new Function(functionCode);
                await executeFunction(mockConsole, { ...module, openLix: module.openLix || (() => {}) });
              } catch (error) {
                console.error('Error executing selected sections:', error);
                logOutput("error", undefined, "Error executing selected sections:", error);
              }
            }
          }
        } else {
          logOutput("error", undefined, "Module doesn't export default function");
        }
      } catch (error) {
        console.error("Error executing code:", error);
        logOutput("error", undefined, "Error executing code:", error);
      }

      // Update state with captured output
      setConsoleOutput(outputs);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="my-4">
      {/* Show hidden code button - styled like in the image */}
      {prerequisiteCode && (
        <div className="mb-2">
          <button
            onClick={() => setSetupExpanded(!setupExpanded)}
            className="text-blue-600 text-sm font-medium flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
          >
            <svg
              className={`w-3 h-3 transition-transform ${
                setupExpanded ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            Show hidden code
          </button>

          {/* Hidden code section with smooth transition */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              setupExpanded ? "max-h-[800px] mt-2" : "max-h-0"
            }`}
          >
            <CodeBlock
              code={prerequisiteCode}
              language="typescript"
              showLineNumbers={true}
            />
          </div>
        </div>
      )}

      {/* Main Code Section */}
      <CodeBlock
        code={currentCode}
        language="typescript"
        showLineNumbers={false}
      />

      {/* Output Section */}
      <div className="mt-4">
        <button
          onClick={async () => {
            if (!hasExecuted) {
              await executeCode();
            }
            setOutputExpanded(!outputExpanded);
          }}
          disabled={isExecuting}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mb-2 disabled:opacity-50"
        >
          <svg
            className={`w-3 h-3 transition-transform ${
              outputExpanded ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          {isExecuting ? "Running..." : "Show output"}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            outputExpanded && hasExecuted ? "max-h-[800px]" : "max-h-0"
          }`}
        >
          {hasExecuted && (
            <CodeBlock
              code={
                consoleOutput.length > 0
                  ? formatConsoleOutput(consoleOutput)
                  : "// Nothing was logged"
              }
              language="javascript"
              showLineNumbers={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}