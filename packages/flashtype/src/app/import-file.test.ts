import { describe, test, expect } from "vitest";
import { sanitizeFilename } from "./import-file";

describe("sanitizeFilename", () => {
	test("converts to lowercase", () => {
		expect(sanitizeFilename("My Document")).toBe("my-document");
	});

	test("replaces special characters with dashes", () => {
		expect(sanitizeFilename("hello!world@test")).toBe("hello-world-test");
	});

	test("removes leading and trailing dashes", () => {
		expect(sanitizeFilename("--test--")).toBe("test");
		expect(sanitizeFilename("!!!test!!!")).toBe("test");
	});

	test("collapses multiple special chars into single dash", () => {
		expect(sanitizeFilename("hello   world")).toBe("hello-world");
		expect(sanitizeFilename("a---b")).toBe("a-b");
	});

	test("truncates to 50 characters", () => {
		const longName = "a".repeat(60);
		const result = sanitizeFilename(longName);
		expect(result.length).toBe(50);
		expect(result).toBe("a".repeat(50));
	});

	test("returns 'new-file' for empty input", () => {
		expect(sanitizeFilename("")).toBe("new-file");
	});

	test("returns 'new-file' when input has only special chars", () => {
		expect(sanitizeFilename("!!!")).toBe("new-file");
		expect(sanitizeFilename("@#$%")).toBe("new-file");
	});

	test("handles markdown header removal in filename", () => {
		expect(sanitizeFilename("# My Title")).toBe("my-title");
		expect(sanitizeFilename("## Another Title")).toBe("another-title");
	});

	test("preserves numbers", () => {
		expect(sanitizeFilename("Document 123")).toBe("document-123");
		expect(sanitizeFilename("2024 Report")).toBe("2024-report");
	});
});
