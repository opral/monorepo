import { describe, expect, test } from "vitest";
import { cloneViewInstance, reorderPanelViewsByIndex } from "./panel-utils";
import type { PanelState, ViewInstance } from "./types";
import {
	AGENT_VIEW_KIND,
	FILES_VIEW_KIND,
	SEARCH_VIEW_KIND,
} from "./view-instance-helpers";

describe("cloneViewInstanceByKey", () => {
	test("clones the matched view and its props", () => {
		const originalProps = { label: "Files", filePath: "/docs/readme.md" };
		const panelState: PanelState = {
			views: [
				{
					instance: "files-1",
					kind: FILES_VIEW_KIND,
					isPending: true,
					props: originalProps,
				} satisfies ViewInstance,
			],
			activeInstance: "files-1",
		};

		const cloned = cloneViewInstance(panelState, "files-1");

		expect(cloned).not.toBeNull();
		expect(cloned).toEqual(panelState.views[0]);
		expect(cloned).not.toBe(panelState.views[0]);
		expect(cloned?.props).not.toBe(originalProps);
	});

	test("returns null when no matching view is found", () => {
		const panelState: PanelState = { views: [], activeInstance: null };

		const cloned = cloneViewInstance(panelState, "missing");

		expect(cloned).toBeNull();
	});
});

describe("panel view reordering", () => {
	const samplePanel: PanelState = {
		views: [
			{ instance: "files-1", kind: FILES_VIEW_KIND },
			{ instance: "search-1", kind: SEARCH_VIEW_KIND },
			{ instance: "agent-1", kind: AGENT_VIEW_KIND },
		],
		activeInstance: "files-1",
	};

	test("reorderPanelViewsByIndex moves an item to the requested index", () => {
		const result = reorderPanelViewsByIndex(samplePanel, 0, 2);
		expect(result.views.map((entry) => entry.instance)).toEqual([
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
