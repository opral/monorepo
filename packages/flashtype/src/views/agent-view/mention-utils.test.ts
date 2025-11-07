import { describe, expect, test } from "vitest";
import { buildMentionList, calculateMentionRange } from "./mention-utils";

const FILES = [
	"config.json",
	"incremental-lix-sync.md",
	"README.md",
	"docs/intro.md",
	"src/app.ts",
];

describe("calculateMentionRange", () => {
	test("returns null when caret not in mention", () => {
		expect(calculateMentionRange("hello world", 5)).toBeNull();
	});

	test("detects mention at end of line", () => {
		expect(calculateMentionRange("open @src/app", 13)).toEqual({
			start: 5,
			end: 13,
			query: "src/app",
		});
	});

	test("handles empty query after @", () => {
		expect(calculateMentionRange("send @", 6)).toEqual({
			start: 5,
			end: 6,
			query: "",
		});
	});
});

describe("buildMentionList", () => {
	test("returns first entries when query empty", () => {
		expect(buildMentionList("", FILES, 3)).toEqual(FILES.slice(0, 3));
	});

	test("filters case-insensitively", () => {
		expect(buildMentionList("app", FILES)).toEqual(["src/app.ts"]);
	});
});
