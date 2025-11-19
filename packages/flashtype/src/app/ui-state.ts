import type { PanelSide, PanelState } from "./types";
import {
	AGENT_VIEW_KIND,
	CHECKPOINT_VIEW_KIND,
	FILES_VIEW_KIND,
} from "./view-instance-helpers";

export const FLASHTYPE_UI_STATE_KEY = "flashtype_ui_state" as const;

/**
 * Serialized layout snapshot persisted in Lix under `flashtype_ui_state`.
 *
 * The structure mirrors the in-memory panel model so we can revive the exact
 * view arrangement (active views, props, focused panel, and optional
 * panel sizes) when the prototype boots.
 *
 * @example
 * const uiState: FlashtypeUiState = {
 *   focusedPanel: "left",
 *   panels: {
 *     left: { views: [...], activeInstance: "files-1" },
 *     central: { views: [], activeInstance: null },
 *     right: { views: [], activeInstance: null },
 *   },
 *   layout: { sizes: { left: 20, central: 60, right: 20 } },
 * };
 */
export type FlashtypeUiState = {
	readonly focusedPanel: PanelSide;
	readonly panels: Record<PanelSide, PanelState>;
	readonly layout?: {
		/**
		 * Last known splitter percentages per panel side (0–100 range).
		 */
		readonly sizes?: Partial<Record<PanelSide, number>>;
	};
};

/**
 * Default UI state used when no persisted snapshot exists in Lix.
 */
export type PanelLayoutSizes = Record<PanelSide, number>;

const DEFAULT_LAYOUT_SIZES: PanelLayoutSizes = {
	left: 0,
	central: 100,
	right: 0,
};

export const DEFAULT_FLASHTYPE_UI_STATE: FlashtypeUiState = {
	focusedPanel: "central",
	panels: {
		left: {
			views: [
				{ instance: "files-default", kind: FILES_VIEW_KIND },
				{ instance: "checkpoint-default", kind: CHECKPOINT_VIEW_KIND },
			],
			activeInstance: "files-default",
		},
		central: { views: [], activeInstance: null },
		right: {
			views: [{ instance: "agent-default", kind: AGENT_VIEW_KIND }],
			activeInstance: "agent-default",
		},
	},
	layout: { sizes: { ...DEFAULT_LAYOUT_SIZES } },
};
export function normalizeLayoutSizes(
	sizes?: Partial<Record<PanelSide, number>>,
): PanelLayoutSizes {
	return {
		left: sizes?.left ?? DEFAULT_LAYOUT_SIZES.left,
		central: sizes?.central ?? DEFAULT_LAYOUT_SIZES.central,
		right: sizes?.right ?? DEFAULT_LAYOUT_SIZES.right,
	};
}

// Persistence helpers rely on trusted writers via `useKeyValue`, so no runtime
// shape guard is exported yet.
