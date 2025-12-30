import { useEffect, useState } from "react";
import { bundledLanguages, createHighlighter, type Highlighter } from "shiki";

// Global highlighter instance.
let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: Object.keys(bundledLanguages),
    });
  }
  return highlighterPromise;
}

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
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-7 0c.55 0 1 .45 1 1s-.45 1-1 1s-1-.45-1-1s.45-1 1-1m7 16H5V5h2v3h10V5h2z"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#22c55e"
                d="m9 16.17l-4.17-4.17l-1.42 1.41L9 19L21 7l-1.41-1.41z"
              />
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

function formatConsoleOutput(
  outputs: Array<{
    level: string;
    args: Array<{ type: string; content: string }>;
    timestamp: string;
    section?: string;
  }>,
): string {
  return outputs
    .map((entry) => {
      const prefix =
        entry.level !== "log" ? `// ${entry.level.toUpperCase()}: ` : "";
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

function dedentCode(code: string): string {
  const lines = code.split("\n");

  let startIndex = 0;
  let endIndex = lines.length - 1;

  while (startIndex < lines.length && lines[startIndex].trim() === "") {
    startIndex++;
  }

  while (endIndex > startIndex && lines[endIndex].trim() === "") {
    endIndex--;
  }

  const trimmedLines = lines.slice(startIndex, endIndex + 1);

  const minIndent = trimmedLines
    .filter((line) => line.trim().length > 0)
    .reduce((min, line) => {
      const match = line.match(/^(\s*)/);
      const indent = match ? match[1].length : 0;
      return Math.min(min, indent);
    }, Infinity);

  if (minIndent === Infinity || minIndent === 0) return trimmedLines.join("\n");

  return trimmedLines.map((line) => line.slice(minIndent)).join("\n");
}

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
  let sectionStartLine = 0;
  let inSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const sectionStartMatch = line.match(/SECTION\s+START\s+['"]([^'"]+)['"]/);
    if (sectionStartMatch) {
      currentSection = sectionStartMatch[1];
      sectionContent = [];
      sectionStartLine = i + 1;
      inSection = true;
      continue;
    }

    const sectionEndMatch = line.match(/SECTION\s+END\s+['"]([^'"]+)['"]/);
    if (sectionEndMatch) {
      if (currentSection && sectionContent.length > 0) {
        sections[currentSection] = dedentCode(sectionContent.join("\n"));
        sectionRanges[currentSection] = { start: sectionStartLine, end: i - 1 };
      }
      currentSection = null;
      inSection = false;
      continue;
    }

    if (!inSection && line.match(/^import\s+/)) {
      importLines.push(line);
    }

    if (
      inSection &&
      currentSection &&
      !line.includes("export default async function") &&
      !line.match(/^}$/)
    ) {
      sectionContent.push(line);
    }
  }

  const fullCode = lines
    .filter(
      (line) =>
        !line.match(/SECTION\s+(START|END)\s+['"]([^'"]+)['"]/) &&
        !line.includes("SECTION"),
    )
    .filter((line) => !line.includes("export default async function"))
    .filter((line) => !line.match(/^}$/))
    .join("\n")
    .trim();

  return { sections, imports: importLines.join("\n"), fullCode, sectionRanges };
}

function transformDynamicImports(code: string): string {
  let transformedCode = code;

  transformedCode = transformedCode.replace(
    /const\s*{\s*(\w+)\s*:\s*(\w+)\s*}\s*=\s*await\s+import\s*\(\s*["']([^"']+)["']\s*\)\s*;/g,
    'import { $1 as $2 } from "$3";',
  );

  transformedCode = transformedCode.replace(
    /const\s*{\s*([^}]+)\s*}\s*=\s*await\s+import\s*\(\s*["']([^"']+)["']\s*\)\s*;/g,
    'import { $1 } from "$2";',
  );

  transformedCode = transformedCode.replace(
    /const\s+(\w+)\s*=\s*await\s+import\s*\(\s*["']([^"']+)["']\s*\)\s*;/g,
    'import $1 from "$2";',
  );

  return transformedCode;
}

function combineSections(
  allSections: Record<string, string>,
  selectedSections?: string[],
): string {
  if (!selectedSections || selectedSections.length === 0) {
    return Object.values(allSections).join("\n\n");
  }

  return selectedSections
    .map((sectionName) => allSections[sectionName])
    .filter(Boolean)
    .join("\n\n")
    .replace(/console1\.log/g, "console.log");
}

function getPrerequisiteCode(
  allSections: Record<string, string>,
  selectedSections: string[],
  imports: string,
): string {
  const sectionNames = Object.keys(allSections);
  const firstSelectedIndex = Math.min(
    ...selectedSections.map((s) => sectionNames.indexOf(s)),
  );

  const prerequisiteSections = sectionNames
    .slice(0, firstSelectedIndex)
    .map((name) => allSections[name])
    .filter(Boolean)
    .join("\n\n");

  return [imports, prerequisiteSections].filter(Boolean).join("\n\n");
}

/**
 * Normalizes raw source input from bundlers into usable code text.
 *
 * @example
 * decodeSource('import { foo } from "./bar";');
 */
function decodeSource(source: string): string {
  const trimmed = source.trim().replace(/;$/, "");
  if (isJsonStringLiteral(trimmed)) {
    return JSON.parse(trimmed) as string;
  }
  return trimmed;
}

/**
 * Checks if a string is a valid JSON string literal.
 *
 * @example
 * isJsonStringLiteral('"hello"');
 */
function isJsonStringLiteral(value: string): boolean {
  if (value.length < 2 || value[0] !== '"' || value[value.length - 1] !== '"') {
    return false;
  }
  return /^"(?:\\["\\/bfnrt]|\\u[0-9a-fA-F]{4}|[^"\\])*"$/.test(value);
}

/**
 * Interactive code example for docs, showing selected SECTIONs and output.
 *
 * The `module` must default-export an async function that accepts a mock console.
 *
 * @example
 * <CodeSnippet module={example} srcCode={raw} sections={["my-section"]} />
 */
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

  const decodedSrcCode = decodeSource(srcCode);

  const { sections: allSections, imports } = parseSections(
    decodedSrcCode.replace(/console1\.log/g, "console.log"),
  );
  const currentCode = transformDynamicImports(
    combineSections(allSections, sections),
  );
  const prerequisiteCode = sections
    ? transformDynamicImports(
        getPrerequisiteCode(allSections, sections, imports),
      )
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
          let currentSection: string | undefined = undefined;

          const mockConsole = {
            log: (...args: any[]) => {
              const firstArg = String(args[0]);
              const sectionStartMatch = firstArg.match(
                /SECTION\s+START\s+['"]([^'"]+)['"]/,
              );
              if (sectionStartMatch) {
                currentSection = sectionStartMatch[1];
                return;
              }
              const sectionEndMatch = firstArg.match(
                /SECTION\s+END\s+['"]([^'"]+)['"]/,
              );
              if (sectionEndMatch) {
                return;
              }
              logOutput("log", currentSection, ...args);
            },
            warn: (...args: any[]) => {
              logOutput("warn", currentSection, ...args);
            },
            error: (...args: any[]) => {
              logOutput("error", currentSection, ...args);
            },
            info: (...args: any[]) => {
              logOutput("info", currentSection, ...args);
            },
          };

          await module.default(mockConsole);
        } else {
          logOutput(
            "error",
            undefined,
            "Module doesn't export default function",
          );
        }
      } catch (error) {
        console.error("Error executing code:", error);
        logOutput("error", undefined, "Error executing code:", error);
      }

      setConsoleOutput(outputs);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="my-4">
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
              aria-hidden="true"
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

      <CodeBlock
        code={currentCode}
        language="typescript"
        showLineNumbers={false}
      />

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
            aria-hidden="true"
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
              code={(() => {
                const filteredOutput = sections
                  ? consoleOutput.filter(
                      (output) =>
                        !output.section || sections.includes(output.section),
                    )
                  : consoleOutput;

                if (filteredOutput.length === 0) {
                  return "// No output";
                }

                return formatConsoleOutput(filteredOutput);
              })()}
              language="javascript"
              showLineNumbers={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
