import { describe, expect, test } from "vitest";
import { isValidDirectoryPath, isValidFilePath } from "./path.js";

const BASE_URL = "https://example.com";
const decodePathname = (path: string) =>
	decodeURIComponent(new URL(path, BASE_URL).pathname);

describe("filesystem path validators", () => {
	test("accepts normalized file paths", () => {
		for (const path of [
			"/docs/readme.md",
			"/a/b/c.txt",
			"/file",
			"/dash--path",
			"/unicodé/段落.md",
		]) {
			expect(isValidFilePath(path)).toBe(true);
			expect(decodePathname(path)).toBe(path);
		}
	});

	test("rejects structural file path anomalies", () => {
		for (const path of ["/", "/trailing/", "no-leading", "/bad//double"]) {
			expect(isValidFilePath(path)).toBe(false);
			expect(() => decodePathname(path)).not.toThrow();
		}
	});

	test("rejects file paths containing dot segments", () => {
		for (const path of ["/docs/./file", "/docs/../file"]) {
			expect(isValidFilePath(path)).toBe(false);
			expect(decodePathname(path)).not.toBe(path);
		}
	});

	test("rejects file paths containing reserved characters", () => {
		for (const path of ["/docs/file?.md", "/docs/#hash", "/docs/foo:bar"]) {
			expect(isValidFilePath(path)).toBe(false);
			expect(() => decodePathname(path)).not.toThrow();
		}
	});

	test("validates percent-encoding in file paths", () => {
		const valid = "/docs/%20notes.md";
		expect(isValidFilePath(valid)).toBe(true);
		expect(decodePathname(valid)).toBe("/docs/ notes.md");

		const invalid = "/docs/%zz.md";
		expect(isValidFilePath(invalid)).toBe(false);
		expect(() => decodePathname(invalid)).toThrow(URIError);
	});

	test("accepts file paths with utf-8 characters", () => {
		const path = "/δοκιμή/файл.md";
		expect(isValidFilePath(path)).toBe(true);
		expect(decodePathname(path)).toBe(path);
	});

	test("accepts normalized directory paths", () => {
		for (const path of ["/docs/", "/docs/guides/", "/unicodé/章节/"]) {
			expect(isValidDirectoryPath(path)).toBe(true);
			expect(decodePathname(path)).toBe(path);
		}
	});

	test("rejects structural directory anomalies", () => {
		for (const path of ["/", "/file.md", "/docs", "/docs/ ", "no-leading"]) {
			expect(isValidDirectoryPath(path)).toBe(false);
			expect(() => decodePathname(path)).not.toThrow();
		}
	});

	test("rejects directory paths containing dot segments", () => {
		for (const path of ["/docs/./", "/docs/../"]) {
			expect(isValidDirectoryPath(path)).toBe(false);
			expect(decodePathname(path)).not.toBe(path);
		}
	});
});
