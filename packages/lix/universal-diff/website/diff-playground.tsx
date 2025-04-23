import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { TabbedContentViewer } from "./tabbed-content-viewer.js";
import dedent from "dedent";
import { renderUniversalDiff } from "../src/render-universal-diff.js";

/**
 * A playground component that allows users to paste in "before" and "after" HTML
 * to see how the diff would look in real-time.
 */
export function DiffPlayground() {
  // Default examples to help users get started
  const defaultBeforeHtml = dedent`
  <p data-diff-id="p1">
    Paste your before HTML here
  </p>
`;

  const defaultAfterHtml = dedent`
  <p data-diff-id="p1">
    Paste your after HTML here to see a diff
  </p>
`;

  const defaultCss = dedent`
  /* Add CSS to style your HTML content */
  /* Use the CSS that you are using in your app to get a 1:1 representation of the diff */
`;

  // Load from localStorage or use defaults
  const loadInitialState = () => {
    // Try localStorage for the user's last session
    try {
      const savedState = localStorage.getItem("diffPlaygroundState");
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e);
    }

    // Fall back to defaults
    return {
      beforeHtml: defaultBeforeHtml,
      afterHtml: defaultAfterHtml,
      customCss: defaultCss,
    };
  };

  // State for the HTML and CSS content
  const [beforeHtml, setBeforeHtml] = useState(
    () => loadInitialState().beforeHtml,
  );
  const [afterHtml, setAfterHtml] = useState(
    () => loadInitialState().afterHtml,
  );
  const [customCss, setCustomCss] = useState(
    () => loadInitialState().customCss,
  );
  const [styleId] = useState(
    `diff-style-${Math.random().toString(36).substring(2, 9)}`,
  );
  const [cssCollapsed, setCssCollapsed] = useState(true);

  // Generate diff based on current state
  const diff = renderUniversalDiff({
    beforeHtml,
    afterHtml,
  });

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

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "diffPlaygroundState",
        JSON.stringify({
          beforeHtml,
          afterHtml,
          customCss,
        }),
      );
    } catch (e) {
      console.error("Error saving state:", e);
    }
  }, [beforeHtml, afterHtml, customCss]);

  // Reset to default state
  const resetToDefault = () => {
    if (confirm("Are you sure you want to reset to default examples?")) {
      setBeforeHtml(defaultBeforeHtml);
      setAfterHtml(defaultAfterHtml);
      setCustomCss(defaultCss);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">
          Paste your HTML in the "Before" and "After" editors to see how the
          diff would look. Make sure to include <code>data-diff-id</code>{" "}
          attributes for elements you want to track.
        </p>
        <button
          onClick={resetToDefault}
          className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded"
        >
          Reset
        </button>
      </div>

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
                padding: { top: 2, bottom: 2 },
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
        <div className="flex-1 min-w-0">
          <TabbedContentViewer
            title="Before"
            htmlContent={beforeHtml}
            onContentChange={setBeforeHtml}
            editable={true}
            showTitle={true}
            defaultTab="code"
          />
        </div>
        <div className="flex-1 min-w-0">
          <TabbedContentViewer
            title="After"
            htmlContent={afterHtml}
            onContentChange={setAfterHtml}
            editable={true}
            showTitle={true}
            defaultTab="code"
          />
        </div>
      </div>

      <div className="mt-8">
        <TabbedContentViewer
          title="Diff Result"
          htmlContent={diff}
          showTitle={true}
          defaultTab="rendered"
        />
      </div>
    </div>
  );
}
