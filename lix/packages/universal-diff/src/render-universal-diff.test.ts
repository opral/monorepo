import { test, expect } from "vitest";
import { renderUniversalDiffElement } from "./render-universal-diff.js";
import { testCases } from "./test-cases.js"; // Import the shared cases

test.each(testCases)(
  "$name", // Use the name property for the test description
  ({ name, beforeHtml, afterHtml, expectedHtml }) => {
    // Destructure the test case object, include name for potential debugging
    const resultElement = renderUniversalDiffElement({ beforeHtml, afterHtml });
    expect(resultElement.outerHTML, `Test failed: ${name}`).toBe(expectedHtml);
  },
);

