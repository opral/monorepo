// @vitest-environment jsdom
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

test("supports custom diffAttribute option (data-id)", () => {
  const beforeHtml = `<p data-id="x" data-diff-mode="words">Hello</p>`;
  const afterHtml = `<p data-id="x" data-diff-mode="words">Hello world</p>`;
  const result = renderHtmlDiff({
    beforeHtml,
    afterHtml,
    diffAttribute: "data-id",
  });
  // Should granular-diff the word 'world'
  expect(result).toContain('<span data-diff-status="added">world</span>');
});
