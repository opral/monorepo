import { test } from "vitest";
import { parseNextIntlMessage } from "../import-export/icu.js";
test("x", () => {
  const p = parseNextIntlMessage({ messageSource: process.env.SRC!, bundleId: "b", locale: "en" });
  console.log(JSON.stringify(p));
});
