import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "./build-system-prompt.js";

describe("buildSystemPrompt", () => {
	it("returns base prompt when no mentions or overlay provided", () => {
		const result = buildSystemPrompt({ basePrompt: "Base" });
		expect(result).toBe("Base");
	});

	it("appends mention guidance when mention paths exist", () => {
		const result = buildSystemPrompt({
			basePrompt: "Base",
			mentionPaths: ["@/app.ts"],
		});
		expect(result).toContain("Base");
		expect(result).toContain("File mentions like @<path>");
	});

	it("appends context overlay after guidance", () => {
		const result = buildSystemPrompt({
			basePrompt: "Base",
			mentionPaths: ["foo"],
			contextOverlay: "context: value",
		});
		expect(result).toMatch(/Base[\s\S]*File mentions[\s\S]*context: value/);
	});
});
