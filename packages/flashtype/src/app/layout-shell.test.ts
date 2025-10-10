import { describe, expect, test } from "vitest";
import { cloneViewInstanceByKey } from "./layout-shell";
import type { PanelState, ViewInstance } from "./types";

describe("cloneViewInstanceByKey", () => {
	test("clones the matched view and its metadata", () => {
		const originalMetadata = { label: "Files", filePath: "/docs/readme.md" };
		const panelState: PanelState = {
			views: [
				{
					instanceKey: "files-1",
					viewKey: "files",
					isPending: true,
					metadata: originalMetadata,
				} satisfies ViewInstance,
			],
			activeInstanceKey: "files-1",
		};

		const cloned = cloneViewInstanceByKey(panelState, "files-1");

		expect(cloned).not.toBeNull();
		expect(cloned).toEqual(panelState.views[0]);
		expect(cloned).not.toBe(panelState.views[0]);
		expect(cloned?.metadata).not.toBe(originalMetadata);
	});

	test("returns null when no matching view is found", () => {
		const panelState: PanelState = { views: [], activeInstanceKey: null };

		const cloned = cloneViewInstanceByKey(panelState, "missing");

		expect(cloned).toBeNull();
	});
});
