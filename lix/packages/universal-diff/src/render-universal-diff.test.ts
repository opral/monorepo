import { test, expect } from "vitest";
import { renderUniversalDiff } from "./render-universal-diff.js";
import { testCases } from "./test-cases.js";

test.each(testCases)(
  "$name",
  ({ name, beforeHtml, afterHtml, expectedHtml }) => {
    const result = renderUniversalDiff({ beforeHtml, afterHtml });
    expect(result, `Test failed: ${name}`).toBe(expectedHtml);
  },
);

