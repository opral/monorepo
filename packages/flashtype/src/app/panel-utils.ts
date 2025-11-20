import type { PanelState, ViewInstance } from "./types";

/**
 * Returns a shallow clone of a view instance stored in a panel, including a
 * copied state object to keep transitions immutable when moving tabs between
 * panels.
 *
 * @example
 * const cloned = cloneViewInstance(panelState, "files-1");
 */
export const cloneViewInstance = (
	panel: PanelState,
	instance: string,
): ViewInstance | null => {
	const view = panel.views.find((entry) => entry.instance === instance);
	if (!view) return null;
	return {
		...view,
		state: view.state ? { ...view.state } : undefined,
		launchArgs: view.launchArgs ? { ...view.launchArgs } : undefined,
	};
};

export const reorderPanelViewsByIndex = (
	panel: PanelState,
	fromIndex: number,
	toIndex: number,
): PanelState => {
	if (
		fromIndex === toIndex ||
		fromIndex < 0 ||
		toIndex < 0 ||
		fromIndex >= panel.views.length ||
		toIndex >= panel.views.length
	) {
		return panel;
	}

	const views = panel.views.slice();
	const [moving] = views.splice(fromIndex, 1);
	views.splice(toIndex, 0, moving);
	return {
		views,
		activeInstance:
			panel.activeInstance === moving.instance
				? moving.instance
				: panel.activeInstance,
	};
};
