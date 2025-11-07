import type { PanelState, ViewInstance } from "./types";

/**
 * Returns a shallow clone of a view instance stored in a panel, including a
 * copied metadata object to keep state transitions immutable when moving tabs
 * between panels.
 *
 * @example
 * const cloned = cloneViewInstanceByKey(panelState, "files-1");
 */
export const cloneViewInstanceByKey = (
	panel: PanelState,
	instanceKey: string,
): ViewInstance | null => {
	const view = panel.views.find((entry) => entry.instanceKey === instanceKey);
	if (!view) return null;
	return {
		...view,
		metadata: view.metadata ? { ...view.metadata } : undefined,
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
		activeInstanceKey:
			panel.activeInstanceKey === moving.instanceKey
				? moving.instanceKey
				: panel.activeInstanceKey,
	};
};
