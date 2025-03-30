import React, { useState } from "react";
import type { TestCase } from "../src/test-cases.js";
import { renderUniversalDiff } from "../src/render-universal-diff.js";
import Editor from "@monaco-editor/react";

/**
 * Renders a single visual test case card using React.
 */
export function TestCaseCard(props: { testCase: TestCase }) {
  // State for editable HTML content
  const [beforeHtml, setBeforeHtml] = useState(props.testCase.beforeHtml);
  const [afterHtml, setAfterHtml] = useState(props.testCase.afterHtml);

  // Generate diff based on current state
  const diff = renderUniversalDiff({
    beforeHtml,
    afterHtml,
  });

  return (
    <div className="border border-gray-300 p-4 mb-4 rounded-md shadow-md">
      <h3 className="text-lg font-semibold mb-2">{props.testCase.name}</h3>

      {/* Instantiate TabbedContentViewer for each section */}
      <TabbedContentViewer
        title="Before"
        htmlContent={beforeHtml}
        onContentChange={setBeforeHtml}
        editable={true}
      />
      <TabbedContentViewer
        title="After"
        htmlContent={afterHtml}
        onContentChange={setAfterHtml}
        editable={true}
      />
      <TabbedContentViewer
        title="Rendered Diff"
        htmlContent={diff}
        editable={false}
      />
    </div>
  );
}

// Helper component for tabbed content view
function TabbedContentViewer(props: {
  title: string;
  htmlContent: string;
  onContentChange?: (newContent: string) => void;
  editable?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"rendered" | "code">("rendered");

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
  // Handle editor content changes
  const handleEditorChange = (value: string | undefined) => {
    if (onContentChange && value !== undefined) {
      onContentChange(value);
    }
  };

  return (
    <Editor
      height="200px"
      defaultLanguage="html"
      defaultValue={htmlContent}
      onChange={handleEditorChange}
      options={{
        readOnly: !editable,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        formatOnPaste: true,
        formatOnType: true,
        wordWrap: "on",
        lineNumbers: "on",
        folding: true,
        scrollbar: {
          vertical: "auto",
          horizontal: "auto",
        },
      }}
      theme="vs-light"
    />
  );
}
