import { test, expect } from "vitest";
import { parseFromText } from "./parse-from-text.js";
import { serializeToText } from "./serialize-to-text.js";

test("parseFromText and serializeToText roundtrip", async () => {
	const text = "Hello world";
	const parsed = parseFromText(text);
	const serialized = serializeToText(parsed);
	expect(serialized).toBe(text);
});
