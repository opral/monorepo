import { test, expect } from "vitest";
import { renderUniversalDiff } from "./render-universal-diff.js";
import { testCases } from "./test-cases.js";

function normalizeHtml(html: string): string {
  return html
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

test.each(testCases)(
  "$name",
  ({ name, beforeHtml, afterHtml, expectedHtml }) => {
    const result = renderUniversalDiff({ beforeHtml, afterHtml });
    expect(normalizeHtml(result), `Test failed: ${name}`).toBe(
      normalizeHtml(expectedHtml),
    );
  },
);
