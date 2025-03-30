import { test, expect } from "vitest";
import { renderUniversalDiff } from "./render-universal-diff.js";
import { testCases } from "./test-cases.js"; // Import the shared cases

test.each(testCases)(
  "$name", // Use the name property for the test description
  ({ name, beforeHtml, afterHtml, expectedHtml }) => {
    // Destructure the test case object, include name for potential debugging
    const resultElement = renderUniversalDiff({ beforeHtml, afterHtml });
    expect(resultElement, `Test failed: ${name}`).toBeInstanceOf(HTMLElement);
    expect(resultElement, `Test failed: ${name}`).toBe(expectedHtml);
  },
);

