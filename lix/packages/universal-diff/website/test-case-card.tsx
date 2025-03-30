import React from "react";
import type { TestCase } from "../src/test-cases.js";
import { renderUniversalDiffElement } from "../src/render-universal-diff.js";

/**
 * Renders a single visual test case card using React.
 */
export function TestCaseCard(props: { testCase: TestCase }) {
  const diffElement = renderUniversalDiffElement({
    beforeHtml: props.testCase.beforeHtml,
    afterHtml: props.testCase.afterHtml,
  });

  return (
    <div className="border border-gray-300 p-4 mb-4 rounded-md shadow-md">
      <h3 className="text-lg font-semibold mb-2">{props.testCase.name}</h3>
      <h4 className="text-md font-medium mt-3 mb-1">Before HTML:</h4>
      <pre className="bg-gray-100 p-2.5 rounded-sm whitespace-pre-wrap break-all font-mono mt-1 mb-2.5">
        <code>{props.testCase.beforeHtml}</code>
      </pre>
      <h4 className="text-md font-medium mt-3 mb-1">After HTML:</h4>
      <pre className="bg-gray-100 p-2.5 rounded-sm whitespace-pre-wrap break-all font-mono mt-1 mb-2.5">
        <code>{props.testCase.afterHtml}</code>
      </pre>
      <h4 className="text-md font-medium mt-3 mb-1">Rendered Diff:</h4>
      <div
        className="diff-output mt-1"
        dangerouslySetInnerHTML={{ __html: diffElement.outerHTML }}
      ></div>
    </div>
  );
}
