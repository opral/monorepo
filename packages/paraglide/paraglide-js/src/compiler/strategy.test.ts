import { test, expect } from "vitest";
import { createStrategyFile } from "./strategy.js";

test("creates the exports for a strategy", () => {
	const result = createStrategyFile({ type: "cookie", cookieName: "locale" });

	expect(result).toBe(
		`/** @type {"cookie" | "custom"} */
export const type = "cookie"
export const cookieName = "locale"
`
	);
});
