import {
	DEFAULT_FLASHTYPE_UI_STATE,
	type FlashtypeUiState,
} from "@/app/ui-state";

export type KeyValueVersionId = "active" | "global" | string;

export type KeyDef<V> = {
	defaultVersionId: KeyValueVersionId;
	untracked: boolean;
	defaultValue?: V | null;
};

// Flashtype keys + per-key defaults
export const KEY_VALUE_DEFINITIONS = {
	// Cross-version UI state, not change-controlled
	flashtype_active_file_id: {
		defaultVersionId: "global",
		untracked: true,
	} as KeyDef<string | null>,

	/**
	 * Persist whether the agent chat is open.
	 * Untracked, global UI preference (not change-controlled).
	 */
	flashtype_agent_chat_open: {
		defaultVersionId: "global",
		untracked: true,
		defaultValue: false,
	} as KeyDef<boolean>,

	/**
	 * When true, the agent auto-accepts all change proposals during this session.
	 * Untracked global UI toggle controlled via the prompt bar (1–2–3 menu).
	 */
	flashtype_auto_accept_session: {
		defaultVersionId: "global",
		untracked: true,
		defaultValue: false,
	} as KeyDef<boolean>,

	/**
	 * Serialized layout snapshot for the v2 prototype (panels, tabs, focus).
	 */
	flashtype_ui_state: {
		defaultVersionId: "global",
		untracked: true,
		defaultValue: DEFAULT_FLASHTYPE_UI_STATE,
	} as KeyDef<FlashtypeUiState>,

	// Test-only keys used in unit tests to exercise tracked behavior
	flashtype_test_tracked: {
		defaultVersionId: "active",
		untracked: false,
	} as KeyDef<string | null>,

	flashtype_test_tracked_external: {
		defaultVersionId: "active",
		untracked: false,
	} as KeyDef<string | null>,

	flashtype_test_untracked: {
		defaultVersionId: "global",
		untracked: true,
		defaultValue: null,
	} as KeyDef<string | null>,
} as const;

export type KnownKey = keyof typeof KEY_VALUE_DEFINITIONS;

export type ValueOf<K extends string> = K extends KnownKey
	? (typeof KEY_VALUE_DEFINITIONS)[K] extends KeyDef<infer V>
		? V
		: never
	: unknown;
