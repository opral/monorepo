import React, { useState } from "react";
import type { TestCase } from "../src/test-cases.js";
import { renderUniversalDiff } from "../src/render-universal-diff.js";
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

      <div className="mt-4">
        <TabbedContentViewer
          title="Rendered Diff"
          htmlContent={diff}
          showTitle={true}
          defaultTab="rendered"
        />
      </div>
    </div>
  );
}
