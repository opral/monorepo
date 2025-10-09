import type { PanelState, ViewInstance } from "./types";

/**
 * Options for configuring how a pending view is inserted into a panel.
 *
 * @example
 * upsertPendingView(panel, view, { activate: false });
 */
export interface UpsertPendingViewOptions {
	readonly activate?: boolean;
}

/**
 * Inserts or replaces the single pending slot in a panel.
 *
 * Ensures that only one pending view exists per panel by removing any prior
 * pending entry before appending the new view. The pending view is activated by
 * default to mirror IDE preview tabs.
 *
 * @example
 * const next = upsertPendingView(panel, {
 *   instanceKey: "file-content-1",
 *   viewKey: "file-content",
 *   isPending: true,
 * });
 */
export function upsertPendingView(
	panel: PanelState,
	view: ViewInstance,
	options: UpsertPendingViewOptions = {},
): PanelState {
	const activate = options.activate ?? true;
	const pendingView: ViewInstance = view.isPending
		? view
		: { ...view, isPending: true };

	const viewsWithoutPending = panel.views.filter((entry) => !entry.isPending);
	const nextViews = [
		...viewsWithoutPending.filter(
			(entry) => entry.instanceKey !== pendingView.instanceKey,
		),
		pendingView,
	];

	const desiredActiveKey = activate
		? pendingView.instanceKey
		: panel.activeInstanceKey;
	const fallbackActive = nextViews[nextViews.length - 1]?.instanceKey ?? null;
	const activeInstanceKey =
		desiredActiveKey &&
		nextViews.some((entry) => entry.instanceKey === desiredActiveKey)
			? desiredActiveKey
			: fallbackActive;

	return {
		views: nextViews,
		activeInstanceKey,
	};
}

/**
 * Options for controlling how a view activation behaves.
 *
 * @example
 * activatePanelView(panel, "files-1", { finalizePending: false });
 */
export interface ActivatePanelViewOptions {
	readonly finalizePending?: boolean;
}

/**
 * Activates a view inside a panel and optionally finalizes pending status.
 *
 * Use this when a preview tab receives user interaction so that its pending
 * flag clears and the tab becomes permanent.
 *
 * @example
 * const next = activatePanelView(panel, "file-content-1");
 */
export function activatePanelView(
	panel: PanelState,
	instanceKey: string,
	options: ActivatePanelViewOptions = {},
): PanelState {
	const finalizePending = options.finalizePending ?? true;
	let found = false;

	const views = panel.views.map((view) => {
		if (view.instanceKey !== instanceKey) return view;
		found = true;
		if (!finalizePending || !view.isPending) {
			return { ...view };
		}
		return { ...view, isPending: false };
	});

	if (!found) return panel;

	return {
		views,
		activeInstanceKey: instanceKey,
	};
}
