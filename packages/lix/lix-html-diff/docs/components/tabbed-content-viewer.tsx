import React, { useState } from "react";
import Editor from "@monaco-editor/react";

/**
 * A component that displays content in either rendered or code view
 */
export function TabbedContentViewer(props: {
  title: string;
  htmlContent: string;
  onContentChange?: (newContent: string) => void;
  editable?: boolean;
  defaultTab?: "rendered" | "code";
  showTitle?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"rendered" | "code">(
    props.defaultTab || "rendered",
  );

  return (
    <div className="relative border border-gray-200 rounded p-3 mt-4">
      {props.showTitle && (
        <h4 className="text-md font-medium mb-2 mt-1">{props.title}</h4>
      )}
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

      <div className="mt-6">
        {activeTab === "rendered" ? (
          <div
            className="min-h-[60px] bg-white"
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
