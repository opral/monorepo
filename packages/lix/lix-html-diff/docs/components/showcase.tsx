import { useRef, useEffect, useState } from "react";
import { renderHtmlDiff } from "../../src/render-html-diff";
import Editor from "@monaco-editor/react";
// @ts-expect-error - raw import
import defaultCss from "../../src/default.css?raw";

interface ShowcaseProps {
  before: string;
  after: string;
  css?: string;
  editable?: boolean;
  onBeforeChange?: (content: string) => void;
  onAfterChange?: (content: string) => void;
}

// ShadowHtml component for style isolation
function ShadowHtml({ html, css }: { html: string; css?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Attach shadow root if not already
    let shadow = ref.current.shadowRoot;
    if (!shadow) {
      shadow = ref.current.attachShadow({ mode: "open" });
    }
    // Clear previous content
    shadow.innerHTML = "";
    // Inject styles (use default CSS if none provided)
    const style = document.createElement("style");
    style.textContent = css || defaultCss;
    shadow.appendChild(style);
    // Inject HTML
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    shadow.appendChild(wrapper);
  }, [html, css]);

  return <div ref={ref} style={{ minHeight: 40 }} />;
}

/**
 * A component that displays content in either rendered or code view
 */
function TabbedContentViewer(props: {
  title: string;
  htmlContent: string;
  onContentChange?: (newContent: string) => void;
  editable?: boolean;
  defaultTab?: "rendered" | "code";
  showTitle?: boolean;
  css?: string;
}) {
  const [activeTab, setActiveTab] = useState<"rendered" | "code">(
    props.defaultTab || "rendered",
  );

  return (
    <div className="relative border border-gray-200 rounded p-3 mt-4">
      {props.showTitle && (
        <h4 className="text-md font-medium mb-2 mt-1">{props.title}</h4>
      )}
      <div className="absolute top-1 right-1 flex items-center bg-gray-50 rounded border border-gray-200 px-1 py-0.5 opacity-60 hover:opacity-100 transition-opacity">
        <button
          className={`px-1.5 py-0.5 text-xs rounded ${activeTab === "rendered" ? "bg-white shadow-xs text-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
          onClick={() => setActiveTab("rendered")}
        >
          Rendered
        </button>
        <div className="text-gray-300 text-xs mx-1">|</div>
        <button
          className={`px-1.5 py-0.5 text-xs rounded ${activeTab === "code" ? "bg-white shadow-xs text-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
          onClick={() => setActiveTab("code")}
        >
          Code
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "rendered" ? (
          <div className="min-h-[60px] bg-white">
            <ShadowHtml html={props.htmlContent} css={props.css} />
          </div>
        ) : (
          <CodeBlock
            htmlContent={props.htmlContent}
            onContentChange={props.onContentChange}
            editable={props.editable}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Helper component for syntax highlighted code block
 */
function CodeBlock({
  htmlContent,
  onContentChange,
  editable = false,
}: {
  htmlContent: string;
  onContentChange?: (newContent: string) => void;
  editable?: boolean;
}) {
  // Calculate height based on content lines (with min/max bounds)
  const lineCount = htmlContent.split('\n').length;
  const calculatedHeight = Math.max(150, Math.min(400, lineCount * 19 + 40));

  return (
    <Editor
      height={`${calculatedHeight}px`}
      defaultLanguage="html"
      value={htmlContent}
      onChange={(value) => {
        if (editable && onContentChange && value !== undefined) {
          onContentChange(value);
        }
      }}
      options={{
        readOnly: !editable,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: "on",
        lineNumbers: "on",
        folding: false,
        glyphMargin: false,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 2,
        padding: { top: 2, bottom: 2 },
        renderLineHighlightOnlyWhenFocus: true,
        renderWhitespace: "none",
        scrollbar: {
          horizontalSliderSize: 4,
          verticalSliderSize: 4,
        },
      }}
      theme="vs-light"
    />
  );
}

export function Showcase({ before, after, css, editable = false, onBeforeChange, onAfterChange }: ShowcaseProps) {
  const diff = renderHtmlDiff({
    beforeHtml: before,
    afterHtml: after,
  });

  // Use provided CSS or fall back to default
  const showcaseCss = css || defaultCss;

  return (
    <div className="max-w-7xl mx-auto my-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TabbedContentViewer
          title="Before"
          htmlContent={before}
          onContentChange={onBeforeChange}
          editable={editable}
          showTitle={true}
          defaultTab={editable ? "code" : "rendered"}
          css={showcaseCss}
        />
        <TabbedContentViewer
          title="After"
          htmlContent={after}
          onContentChange={onAfterChange}
          editable={editable}
          showTitle={true}
          defaultTab={editable ? "code" : "rendered"}
          css={showcaseCss}
        />
      </div>
      
      <TabbedContentViewer
        title="Diff Result"
        htmlContent={diff}
        showTitle={true}
        defaultTab="rendered"
        css={showcaseCss}
      />
    </div>
  );
}