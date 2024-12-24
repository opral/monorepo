import { jsIdentifier } from "./identifier.js";
import { expect, test } from "vitest";

test('escapes "-" to "_"', () => {
  expect(jsIdentifier("de-DE-bavaria")).toBe("de_DE_bavaria");
});

test("prefixes with _ if it starts with a number", () => {
  expect(jsIdentifier("123")).toBe("_123");
});
