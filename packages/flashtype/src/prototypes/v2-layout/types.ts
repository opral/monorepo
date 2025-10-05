import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Lix } from "@lix-js/sdk";
import type { SelectQueryBuilder } from "kysely";

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
	| "history"
	| "file-content"
	| "commit"
	| "diff";

/**
 * Declares how a diff view should source its data.
 *
 * @example
 * const source: DiffSource = { kind: "working-vs-checkpoint", fileId: "file-123" };
 */
export type RenderableDiff = {
	readonly entity_id: string;
	readonly schema_key: string;
	readonly status: "added" | "modified" | "removed" | "unchanged";
	readonly plugin_key: string;
	readonly before_snapshot_content: unknown;
	readonly after_snapshot_content: unknown;
};

export type DiffViewConfig = {
	readonly title?: string;
	readonly subtitle?: string;
	readonly query: (ctx: { lix: Lix }) => SelectQueryBuilder<any, any, RenderableDiff>;
};

/**
 * Per-panel instance metadata used to track which views are open.
 *
 * @example
 * const view: PanelView = {
 *   viewKey: "files-1",
 *   viewId: "files",
 *   metadata: { fileId: "file-123" },
 * };
 */
export interface PanelView {
	readonly viewKey: string;
	readonly viewId: ViewId;
	readonly isPending?: boolean;
	readonly metadata?: {
		readonly filePath?: string;
		readonly label?: string;
		readonly checkpointId?: string;
		readonly fileId?: string;
		readonly diff?: DiffViewConfig;
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
 * context.onOpenDiff?.("file-123", "/docs/guide.md");
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
	readonly onOpenDiff?: (
		fileId: string,
		filePath: string,
		options?: {
			/**
			 * Whether the central panel should receive focus when the diff opens.
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
