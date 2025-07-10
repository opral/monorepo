import { test, expect } from "vitest";
import { renderHtmlDiff } from "./render-html-diff.js";
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
    const result = renderHtmlDiff({ beforeHtml, afterHtml });
    expect(normalizeHtml(result), `Test failed: ${name}`).toBe(
      normalizeHtml(expectedHtml),
    );
  },
);
