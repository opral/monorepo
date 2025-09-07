/**
 * Chat message primitives for the mock agent UI.
 */
export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
	/** Stable id for React keys. */
	id: string;
	/** Who authored the message. */
	role: ChatRole;
	/** Plain text content. Supports Markdown-like fences but rendered monospace. */
	content: string;
	/** Optional timestamp for display purposes. */
	at?: number;
}

/** Keyboard shortcut descriptor. */
export interface KeyHint {
	/** Key label, e.g., Enter, ⌘K, / */
	key: string;
	/** Short description of what the shortcut does. */
	label: string;
}
