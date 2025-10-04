import type { PanelState, PanelView } from "./types";

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
 *   viewKey: "file-content-1",
 *   viewId: "file-content",
 *   isPending: true,
 * });
 */
export function upsertPendingView(
	panel: PanelState,
	view: PanelView,
	options: UpsertPendingViewOptions = {},
): PanelState {
	const activate = options.activate ?? true;
	const pendingView: PanelView = view.isPending
		? view
		: { ...view, isPending: true };

	const viewsWithoutPending = panel.views.filter((entry) => !entry.isPending);
	const nextViews = [
		...viewsWithoutPending.filter((entry) => entry.viewKey !== pendingView.viewKey),
		pendingView,
	];

	const desiredActiveKey = activate ? pendingView.viewKey : panel.activeViewKey;
	const fallbackActive = nextViews[nextViews.length - 1]?.viewKey ?? null;
	const activeViewKey =
		desiredActiveKey && nextViews.some((entry) => entry.viewKey === desiredActiveKey)
			? desiredActiveKey
			: fallbackActive;

	return {
		views: nextViews,
		activeViewKey,
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
	viewKey: string,
	options: ActivatePanelViewOptions = {},
): PanelState {
	const finalizePending = options.finalizePending ?? true;
	let found = false;

	const views = panel.views.map((view) => {
		if (view.viewKey !== viewKey) return view;
		found = true;
		if (!finalizePending || !view.isPending) {
			return { ...view };
		}
		return { ...view, isPending: false };
	});

	if (!found) return panel;

	return {
		views,
		activeViewKey: viewKey,
	};
}
