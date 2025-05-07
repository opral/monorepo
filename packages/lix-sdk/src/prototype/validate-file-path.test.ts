import { test, expect } from "vitest";
import { isValidFilePath } from "./validate-file-path.js";

test("valid cases", () => {
	const validCases = [
		"/path/to/file",
		"/path/to/file/with/multiple/segments",
		"/path/to/file.with.dots",
		"/path/to/file-with-hyphens_and_underscores",
		"/path/with-file-extension.txt",
	];

	for (const validCase of validCases) {
		expect(isValidFilePath(validCase)).toBe(true);
		// testing for RFC 3986 URI
		expect(URL.canParse(`file://${validCase}`)).toBe(true);
	}
});

// invalid cases

test("an empty path should be invalid", () => {
	expect(isValidFilePath("")).toBe(false);
});

test("a path that contains only a slash should be invalid", () => {
	expect(isValidFilePath("/")).toBe(false);
});

test("a path that does not start with a slash should be invalid", () => {
	expect(isValidFilePath("path/to/file")).toBe(false);
});

test("a path that ends with a slash should be invalid", () => {
	expect(isValidFilePath("/path/to/file/")).toBe(false);
});

test("a path that contains consecutive slashes should be invalid", () => {
	expect(isValidFilePath("/path//to/file")).toBe(false);
});

test("a path that contains backslashes should be invalid", () => {
	expect(isValidFilePath("/path\\to\\file")).toBe(false);
});
