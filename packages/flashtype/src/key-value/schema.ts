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

	flashtype_left_sidebar_active_tab: {
		defaultVersionId: "global",
		untracked: true,
	} as KeyDef<"files" | "history" | null>,

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
	 * Whether the Diff view is open.
	 * Untracked global UI state so the swap doesn't affect versions.
	 */
	flashtype_diff_open: {
		defaultVersionId: "global",
		untracked: true,
		defaultValue: false,
	} as KeyDef<boolean>,

	/**
	 * Preferred diff layout mode.
	 * Untracked global UI preference.
	 */
	flashtype_diff_view: {
		defaultVersionId: "global",
		untracked: true,
		defaultValue: "unified",
	} as KeyDef<"unified" | "side-by-side">,

	/**
	 * Optional source version id for DiffView.
	 * If set, DiffView compares this version against Main.
	 */
	flashtype_diff_source_version_id: {
		defaultVersionId: "global",
		untracked: true,
		defaultValue: null,
	} as KeyDef<string | null>,

	// Test-only keys used in unit tests to exercise tracked behavior
	flashtype_test_tracked: {
		defaultVersionId: "active",
		untracked: false,
	} as KeyDef<string | null>,

	flashtype_test_tracked_external: {
		defaultVersionId: "active",
		untracked: false,
	} as KeyDef<string | null>,
} as const;

export type KnownKey = keyof typeof KEY_VALUE_DEFINITIONS;

export type ValueOf<K extends string> = K extends KnownKey
	? (typeof KEY_VALUE_DEFINITIONS)[K] extends KeyDef<infer V>
		? V
		: never
	: unknown;
