// @ts-nocheck

import { test, expect } from "vitest";
import { serializedPattern } from "./serializePattern.js";

test("it should serialize variable references to {name}", async () => {
	const pattern: Message["variants"][number]["pattern"] = [
		{ type: "Text", value: "Hello " },
		{ type: "VariableReference", name: "name" },
		{ type: "Text", value: "!" },
	];
	const serialized = serializedPattern(pattern);
	expect(serialized).toBe("Hello {name}!");
});
