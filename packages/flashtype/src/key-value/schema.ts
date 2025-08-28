export type KeyValueVersionId = "active" | "global" | string;

export type KeyDef<V> = {
	defaultVersionId: KeyValueVersionId;
	untracked: boolean;
	defaultValue?: V | null;
};

// Flashtype keys + per-key defaults
export const KEY_VALUE_DEFINITIONS = {
	// Cross-version UI state, not change-controlled
	flashtype_active_file: {
		defaultVersionId: "global",
		untracked: true,
	} as KeyDef<string | null>,

	flashtype_left_dock_tab: {
		defaultVersionId: "global",
		untracked: true,
	} as KeyDef<"files" | "history" | null>,
} as const;

export type KnownKey = keyof typeof KEY_VALUE_DEFINITIONS;

export type ValueOf<K extends string> = K extends KnownKey
	? (typeof KEY_VALUE_DEFINITIONS)[K] extends KeyDef<infer V>
		? V
		: never
	: unknown;
