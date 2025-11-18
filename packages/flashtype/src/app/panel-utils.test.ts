import { describe, expect, test } from "vitest";
import {
	cloneViewInstanceByKey,
	reorderPanelViewsByIndex,
} from "./panel-utils";
import type { PanelState, ViewInstance } from "./types";

	describe("cloneViewInstanceByKey", () => {
	test("clones the matched view and its props", () => {
		const originalProps = { label: "Files", filePath: "/docs/readme.md" };
		const panelState: PanelState = {
			views: [
				{
					instanceKey: "files-1",
					viewKey: "files",
					isPending: true,
					props: originalProps,
				} satisfies ViewInstance,
			],
			activeInstanceKey: "files-1",
		};

		const cloned = cloneViewInstanceByKey(panelState, "files-1");

		expect(cloned).not.toBeNull();
		expect(cloned).toEqual(panelState.views[0]);
		expect(cloned).not.toBe(panelState.views[0]);
		expect(cloned?.props).not.toBe(originalProps);
	});

	test("returns null when no matching view is found", () => {
		const panelState: PanelState = { views: [], activeInstanceKey: null };

		const cloned = cloneViewInstanceByKey(panelState, "missing");

		expect(cloned).toBeNull();
	});
});

describe("panel view reordering", () => {
	const samplePanel: PanelState = {
		views: [
			{ instanceKey: "files-1", viewKey: "files" },
			{ instanceKey: "search-1", viewKey: "search" },
			{ instanceKey: "agent-1", viewKey: "agent" },
		],
		activeInstanceKey: "files-1",
	};

	test("reorderPanelViewsByIndex moves an item to the requested index", () => {
		const result = reorderPanelViewsByIndex(samplePanel, 0, 2);
		expect(result.views.map((entry) => entry.instanceKey)).toEqual([
			"search-1",
			"agent-1",
			"files-1",
		]);
	});

	test("reorderPanelViewsByIndex ignores invalid indices", () => {
		const unchanged = reorderPanelViewsByIndex(samplePanel, -1, 2);
		expect(unchanged).toEqual(samplePanel);
	});
});
