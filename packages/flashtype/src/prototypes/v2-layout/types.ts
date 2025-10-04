import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Union of registry keys for views available in the layout.
 *
 * @example
 * const activeView: ViewKey = "files";
 */
export type ViewKey =
	| "agent"
	| "files"
	| "search"
	| "tasks"
	| "checkpoint"
	| "history"
	| "file-content"
	| "commit";

/**
 * Per-panel instance metadata used to track which views are open.
 *
 * @example
 * const instance: ViewInstance = { instanceKey: "files-1", viewKey: "files" };
 */
export interface ViewInstance {
	readonly instanceKey: string;
	readonly viewKey: ViewKey;
	readonly isPending?: boolean;
	readonly metadata?: {
		readonly filePath?: string;
		readonly label?: string;
		readonly checkpointId?: string;
	};
}

/**
 * Shape of the static metadata that powers the view switcher UI.
 *
 * @example
 * const filesView: ViewDefinition = VIEW_DEFINITIONS[0];
 */
export interface ViewDefinition {
	readonly key: ViewKey;
	readonly label: string;
	readonly description: string;
	readonly icon: LucideIcon;
	readonly render: (context?: ViewContext, view?: ViewInstance) => ReactNode;
}

/**
 * Context passed to views for interacting with the layout.
 *
 * @example
 * context.onOpenFile?.("/docs/guide.md", { focus: false });
 */
export interface ViewContext {
	readonly onOpenFile?: (
		filePath: string,
		options?: {
			/**
			 * Whether the central panel should receive focus when the file opens.
			 * Defaults to `true` for backwards compatibility.
			 */
			readonly focus?: boolean;
		},
	) => void;
	readonly onOpenCommit?: (
		checkpointId: string,
		label: string,
		options?: {
			/**
			 * Whether the central panel should receive focus when the commit opens.
			 * Defaults to `true` for backwards compatibility.
			 */
			readonly focus?: boolean;
		},
	) => void;
	readonly isPanelFocused?: boolean;
}

/**
 * Lightweight state container that represents one panel island.
 *
 * @example
 * const leftPanel: PanelState = { views: [], activeInstanceKey: null };
 */
export interface PanelState {
	readonly views: ViewInstance[];
	readonly activeInstanceKey: string | null;
}

/**
 * Declares the available sides that panels can mount on.
 *
 * @example
 * const side: PanelSide = "left";
 */
export type PanelSide = "left" | "right" | "central";
