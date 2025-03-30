import React, { useState, useEffect } from "react";
import { renderUniversalDiff } from "../src/render-universal-diff.js";
import Editor from "@monaco-editor/react";

/**
 * A playground component that allows users to paste in "before" and "after" HTML
 * to see how the diff would look in real-time.
 */
export function DiffPlayground() {
  // Default examples to help users get started
  const defaultBeforeHtml = `<div>
  <p data-lix-entity-id="p1">This is a paragraph</p>
  <p data-lix-entity-id="p2">This will be modified</p>
</div>`;

  const defaultAfterHtml = `<div>
  <p data-lix-entity-id="p1">This is a paragraph</p>
  <p data-lix-entity-id="p2">This has been modified</p>
  <p data-lix-entity-id="p3">This is a new paragraph</p>
</div>`;

  const defaultCss = `/* Add CSS to style your HTML content */

  use the css that you are using in your app to get a 1:1 representation of the diff

*/`;

  // State for the HTML and CSS content
  const [beforeHtml, setBeforeHtml] = useState(defaultBeforeHtml);
  const [afterHtml, setAfterHtml] = useState(defaultAfterHtml);
  const [customCss, setCustomCss] = useState(defaultCss);
  const [styleId] = useState(
    `diff-style-${Math.random().toString(36).substring(2, 9)}`,
  );
  const [cssCollapsed, setCssCollapsed] = useState(true);

  // Generate diff based on current state
  const diffElement = renderUniversalDiff({
    beforeHtml,
    afterHtml,
  });

  // Convert the HTMLElement to a string for display
  const diff = diffElement.outerHTML;

  // Apply custom CSS to the diff view
  useEffect(() => {
    // Create or update the style element
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = customCss;

    // Cleanup on unmount
    return () => {
      const element = document.getElementById(styleId);
      if (element) {
        document.head.removeChild(element);
      }
    };
  }, [customCss, styleId]);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Playground</h2>
      <p className="mb-4 text-gray-600">
        Paste your HTML in the "Before" and "After" editors to see how the diff
        would look. Make sure to include <code>data-lix-entity-id</code>{" "}
        attributes for elements you want to track.
      </p>

      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold mb-2">CSS</h3>
          <button
            onClick={() => setCssCollapsed(!cssCollapsed)}
            className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
          >
            {cssCollapsed ? "Expand" : "Collapse"}
          </button>
        </div>
        {!cssCollapsed && (
          <div className="border border-gray-300 rounded">
            <Editor
              height="150px"
              defaultLanguage="css"
              value={customCss}
              onChange={(value) => value !== undefined && setCustomCss(value)}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                wordWrap: "on",
                lineNumbers: "on",
              }}
              theme="vs-light"
            />
          </div>
        )}
        {cssCollapsed && (
          <div className="text-sm text-gray-500 italic border border-gray-200 bg-gray-50 p-2 rounded">
            CSS editor is collapsed. Click "Expand" to edit.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Before HTML</h3>
          <TabbedContentViewer
            title="Before HTML"
            htmlContent={beforeHtml}
            onContentChange={setBeforeHtml}
            editable={true}
            defaultTab="code"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">After HTML</h3>
          <TabbedContentViewer
            title="After HTML"
            htmlContent={afterHtml}
            onContentChange={setAfterHtml}
            editable={true}
            defaultTab="code"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Diff Result</h3>
        <TabbedContentViewer
          title="Rendered Diff"
          htmlContent={diff}
          editable={false}
        />
      </div>
    </div>
  );
}

// Helper component for tabbed content view
function TabbedContentViewer(props: {
  title: string;
  htmlContent: string;
  onContentChange?: (newContent: string) => void;
  editable?: boolean;
  defaultTab?: "rendered" | "code";
}) {
  const [activeTab, setActiveTab] = useState<"rendered" | "code">(
    props.defaultTab || "rendered",
  );

  return (
    <div className="relative border border-gray-200 rounded p-3 mt-4">
      <div className="absolute top-1 right-1 flex space-x-1 bg-gray-100 rounded border border-gray-300 p-0.5">
        <button
          className={`px-2 py-0.5 text-xs rounded ${activeTab === "rendered" ? "bg-white shadow-sm font-medium text-gray-800" : "text-gray-500 hover:bg-gray-200"}`}
          onClick={() => setActiveTab("rendered")}
        >
          Rendered
        </button>
        <button
          className={`px-2 py-0.5 text-xs rounded ${activeTab === "code" ? "bg-white shadow-sm font-medium text-gray-800" : "text-gray-500 hover:bg-gray-200"}`}
          onClick={() => setActiveTab("code")}
        >
          Code
        </button>
      </div>

      <h4 className="text-md font-medium mb-2 mt-1">{props.title}:</h4>
      {activeTab === "rendered" ? (
        <div
          className="min-h-[60px] bg-white mt-2"
          dangerouslySetInnerHTML={{
            __html: props.htmlContent,
          }}
        ></div>
      ) : (
        <CodeBlock
          htmlContent={props.htmlContent}
          onContentChange={props.onContentChange}
          editable={props.editable}
        />
      )}
    </div>
  );
}

// Helper component for syntax highlighted code block
function CodeBlock({
  htmlContent,
  onContentChange,
  editable = false,
}: {
  htmlContent: string;
  onContentChange?: (newContent: string) => void;
  editable?: boolean;
}) {
  return (
    <Editor
      height="150px"
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
      }}
      theme="vs-light"
    />
  );
}
