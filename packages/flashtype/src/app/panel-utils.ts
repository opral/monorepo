import type { PanelState, ViewInstance } from "./types";

const deepCloneValue = <T>(input: T): T => {
	if (Array.isArray(input)) {
		return input.map((item) => deepCloneValue(item)) as unknown as T;
	}

	if (input instanceof Date) {
		return new Date(input.getTime()) as unknown as T;
	}

	if (input instanceof Map) {
		return new Map(
			Array.from(input.entries(), ([key, value]) => [
				deepCloneValue(key),
				deepCloneValue(value),
			]),
		) as unknown as T;
	}

	if (input instanceof Set) {
		return new Set(Array.from(input.values(), (value) => deepCloneValue(value))) as unknown as T;
	}

	if (input && typeof input === "object") {
		return Object.fromEntries(
			Object.entries(input as Record<string, unknown>).map(([key, value]) => [
				key,
				deepCloneValue(value),
			]),
		) as T;
	}

	return input;
};

/**
 * Returns a view instance clone with deep-cloned state and launch args to keep
 * transitions immutable when moving tabs between panels.
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
		state: view.state ? deepCloneValue(view.state) : undefined,
		launchArgs: view.launchArgs ? deepCloneValue(view.launchArgs) : undefined,
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
