import { test, expect } from "vitest";
import { detectChanges } from "./detect-changes.js";
import type { DetectedChange } from "../plugin/lix-plugin.js";

test("it should detect no changes for identical files", async () => {
	const before = `Hello World`;
	const after = before;

	const detectedChanges = await runDetectChanges(before, after);

	expect(detectedChanges).toEqual([]);
});

test("it should detect changes for lines that differ", async () => {
	const before = `Hello World`;
	const after = `Hello World\nHow are you?`;

	const detectedChanges = await runDetectChanges(before, after);

	expect(detectedChanges).toEqual([
		{
			entity_id: "1",
			type: "line",
			snapshot: { text: "How are you?" },
		},
	] satisfies DetectedChange[]);
});

async function runDetectChanges(before: string, after: string) {
	return detectChanges({
		before: {
			data: new TextEncoder().encode(before),
			id: "mock",
			path: "mock-path.txt",
			metadata: null,
		},
		after: {
			data: new TextEncoder().encode(after),
			id: "mock",
			path: "mock-path.txt",
			metadata: null,
		},
	});
}
