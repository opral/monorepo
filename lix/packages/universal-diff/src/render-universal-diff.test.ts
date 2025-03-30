import { test, expect } from "vitest";
import { renderUniversalDiff } from "./render-universal-diff.js";

test("it returns a div", () => {
  const result = renderUniversalDiff({
    beforeHtml: "",
    afterHtml: "",
  });
  expect(result).toBeInstanceOf(HTMLElement);
});
