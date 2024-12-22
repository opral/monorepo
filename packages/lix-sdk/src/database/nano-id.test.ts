import { expect, test } from "vitest";
import { _nanoIdAlphabet, nanoid } from "./nano-id.js";

test("length is obeyed", () => {
	const id = nanoid(10);
	expect(id.length).toBe(10);
});

test("the alphabet does not contain underscores `_` because they are not URL safe", () => {
	expect(_nanoIdAlphabet).not.toContain("_");
});

test("the alphabet does not contain dashes `-` because they break selecting the ID from the URL in the browser", () => {
	expect(_nanoIdAlphabet).not.toContain("-");
});
