import { describe, expect, test } from "vitest";
import { cloneViewInstance, reorderPanelViewsByIndex } from "./panel-utils";
import type { PanelState, ViewInstance } from "./types";
import {
	AGENT_VIEW_KIND,
	FILES_VIEW_KIND,
	SEARCH_VIEW_KIND,
} from "./view-instance-helpers";

describe("cloneViewInstanceByKey", () => {
	test("clones the matched view and its state", () => {
		const originalState = { label: "Files", filePath: "/docs/readme.md" };
		const panelState: PanelState = {
			views: [
				{
					instance: "files-1",
					kind: FILES_VIEW_KIND,
					isPending: true,
					state: originalState,
				} satisfies ViewInstance,
			],
			activeInstance: "files-1",
		};

		const cloned = cloneViewInstance(panelState, "files-1");

		expect(cloned).not.toBeNull();
		expect(cloned).toEqual(panelState.views[0]);
		expect(cloned).not.toBe(panelState.views[0]);
		expect(cloned?.state).not.toBe(originalState);
	});

	test("deep clones nested state and launch args", () => {
		const query = () => null;
		const panelState: PanelState = {
			views: [
				{
					instance: "files-1",
					kind: FILES_VIEW_KIND,
					state: { diff: { query, metadata: { nested: true } } },
					launchArgs: { initial: { path: "/docs" } },
				} satisfies ViewInstance,
			],
			activeInstance: "files-1",
		};

		const cloned = cloneViewInstance(panelState, "files-1");

		expect(cloned).not.toBeNull();
		const clonedState = (cloned as ViewInstance).state as any;
		const originalState = panelState.views[0].state as any;
		expect(clonedState).not.toBe(originalState);
		expect(clonedState.diff).not.toBe(originalState.diff);
		expect(clonedState.diff.query).toBe(query);
		expect(clonedState.diff.metadata).not.toBe(originalState.diff.metadata);
		const clonedLaunchArgs = (cloned as ViewInstance).launchArgs as any;
		const originalLaunchArgs = panelState.views[0].launchArgs as any;
		expect(clonedLaunchArgs).not.toBe(originalLaunchArgs);
		expect(clonedLaunchArgs.initial).not.toBe(originalLaunchArgs.initial);
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
