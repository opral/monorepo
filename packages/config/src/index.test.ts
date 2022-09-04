import { test, expect } from "vitest";
import { hello } from "./index.js";

test("it should work", () => {
	expect(hello("hello")).toBe("hello world");
});
