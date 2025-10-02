import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Union of the prototype view identifiers that can mount inside a panel.
 *
 * @example
 * const activeView: ViewId = "files";
 */
export type ViewId = "files" | "search" | "tasks" | "file-content";

/**
 * Per-panel instance metadata used to track which views are open.
 *
 * @example
 * const instance: ViewInstance = { instanceId: "files-1", viewId: "files" };
 */
export interface ViewInstance {
	readonly instanceId: string;
	readonly viewId: ViewId;
	readonly metadata?: {
		readonly fileName?: string;
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
	readonly render: (context?: ViewContext, instance?: ViewInstance) => ReactNode;
}

/**
 * Context passed to views for interacting with the layout
 */
export interface ViewContext {
	readonly onOpenFile?: (fileName: string) => void;
}

/**
 * Lightweight state container that represents one panel island.
 *
 * @example
 * const leftPanel: PanelState = { instances: [], activeInstanceId: null };
 */
export interface PanelState {
	readonly instances: ViewInstance[];
	readonly activeInstanceId: string | null;
}

/**
 * Declares the available sides that panels can mount on.
 *
 * @example
 * const side: PanelSide = "left";
 */
export type PanelSide = "left" | "right" | "central";
