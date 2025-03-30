import React, { useState } from "react";
import type { TestCase } from "../src/test-cases.js";
import { renderUniversalDiff } from "../src/render-universal-diff.js";
import Editor from "@monaco-editor/react";
import { TabbedContentViewer } from "./tabbed-content-viewer.js";

/**
 * Renders a single visual test case card using React.
 */
export function TestCaseCard(props: { testCase: TestCase }) {
  // State for editable HTML content
  const [beforeHtml, setBeforeHtml] = useState(props.testCase.beforeHtml);
  const [afterHtml, setAfterHtml] = useState(props.testCase.afterHtml);

  // Generate diff based on current state
  const diffElement = renderUniversalDiff({
    beforeHtml,
    afterHtml,
  });

  // Convert the HTMLElement to a string for display
  const diff = diffElement.outerHTML;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{props.testCase.name}</h3>

      {/* Instantiate TabbedContentViewer for each section */}
      <TabbedContentViewer
        title="Before"
        htmlContent={beforeHtml}
        onContentChange={setBeforeHtml}
        editable={true}
        showTitle={true}
      />
      <TabbedContentViewer
        title="After"
        htmlContent={afterHtml}
        onContentChange={setAfterHtml}
        editable={true}
        showTitle={true}
      />
      <TabbedContentViewer
        title="Rendered Diff"
        htmlContent={diff}
        showTitle={true}
      />
    </div>
  );
}
