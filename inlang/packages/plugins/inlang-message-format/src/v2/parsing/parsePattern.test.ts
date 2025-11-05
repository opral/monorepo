// @ts-nocheck

import { test, expect } from "vitest";
import { parsePattern } from "./parsePattern.js";

test("it parse a variable reference", async () => {
	const parsed = parsePattern("Hello {name}!");

	const pattern: Message["variants"][number]["pattern"] = [
		{ type: "Text", value: "Hello " },
		{ type: "VariableReference", name: "name" },
		{ type: "Text", value: "!" },
	];

	expect(parsed).toStrictEqual(pattern);
});
