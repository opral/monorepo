import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Union of the prototype view identifiers that can mount inside a panel.
 *
 * @example
 * const activeView: ViewId = "files";
 */
export type ViewId =
	| "files"
	| "search"
	| "tasks"
	| "checkpoint"
	| "file-content";

/**
 * Per-panel instance metadata used to track which views are open.
 *
 * @example
 * const view: PanelView = { viewKey: "files-1", viewId: "files" };
 */
export interface PanelView {
	readonly viewKey: string;
	readonly viewId: ViewId;
	readonly metadata?: {
		readonly filePath?: string;
		readonly label?: string;
	};
}

/**
 * Shape of the static metadata that powers the view switcher UI.
 *
 * @example
 * const filesView: ViewDefinition = VIEW_DEFINITIONS[0];
 */
export interface ViewDefinition {
	readonly id: ViewId;
	readonly label: string;
	readonly description: string;
	readonly icon: LucideIcon;
	readonly render: (
		context?: ViewContext,
		view?: PanelView,
	) => ReactNode;
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
	readonly isPanelFocused?: boolean;
}

/**
 * Lightweight state container that represents one panel island.
 *
 * @example
 * const leftPanel: PanelState = { views: [], activeViewKey: null };
 */
export interface PanelState {
	readonly views: PanelView[];
	readonly activeViewKey: string | null;
}

/**
 * Declares the available sides that panels can mount on.
 *
 * @example
 * const side: PanelSide = "left";
 */
export type PanelSide = "left" | "right" | "central";
