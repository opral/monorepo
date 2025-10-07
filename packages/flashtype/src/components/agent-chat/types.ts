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
	/** Optional tool-call simulation data rendered for assistant messages. */
	toolRuns?: ToolRun[];
}

/** Keyboard shortcut descriptor. */
export interface KeyHint {
	/** Key label, e.g., Enter, ⌘K, / */
	key: string;
	/** Short description of what the shortcut does. */
	label: string;
}

export type ToolRunStatus =
	| "queued"
	| "running"
	| "success"
	| "error"
	| "thinking";

export interface ToolRun {
	id: string;
	title: string; // e.g., "Bash", "Read", "Glob", or "Thinking"
	detail?: string; // e.g., "List contents of directory"
	status: ToolRunStatus;
	/** Optional input parameters shown in IN section. */
	input?: string;
	/** Optional expandable output shown in OUT section. */
	output?: string;
	/** Optional reasoning/thinking content shown inline (for thinking status). */
	content?: string;
}
