import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Union of the prototype tool identifiers that can mount inside a panel.
 *
 * @example
 * const activeTool: ToolId = "files";
 */
export type ToolId = "files" | "search" | "git" | "assistant" | "terminal" | "tasks";

/**
 * Per-panel instance metadata used to track which tools are open.
 *
 * @example
 * const instance: ToolInstance = { instanceId: "files-1", toolId: "files" };
 */
export interface ToolInstance {
	readonly instanceId: string;
	readonly toolId: ToolId;
}

/**
 * Shape of the static metadata that powers the tool switcher UI.
 *
 * @example
 * const filesTool: ToolDefinition = TOOL_DEFINITIONS[0];
 */
export interface ToolDefinition {
	readonly id: ToolId;
	readonly label: string;
	readonly description: string;
	readonly icon: LucideIcon;
	readonly render: () => ReactNode;
}

/**
 * Lightweight state container that represents one panel island.
 *
 * @example
 * const leftPanel: PanelState = { instances: [], activeInstanceId: null };
 */
export interface PanelState {
	readonly instances: ToolInstance[];
	readonly activeInstanceId: string | null;
}

/**
 * Declares the available sides that panels can mount on.
 *
 * @example
 * const side: PanelSide = "left";
 */
export type PanelSide = "left" | "right";
