import type { LucideIcon } from "lucide-react";
import type { Lix } from "@lix-js/sdk";
import type { SelectQueryBuilder } from "@lix-js/sdk/dependency/kysely";

/**
 * Union of registry keys for views available in the layout.
 *
 * @example
 * const activeView: ViewKey = "files";
 */
export type ViewKey = string;

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
	readonly before_snapshot_content: Record<string, any> | null;
	readonly after_snapshot_content: Record<string, any> | null;
};

export type DiffViewConfig = {
	readonly title?: string;
	readonly subtitle?: string;
	readonly query: (ctx: {
		lix: Lix;
	}) => SelectQueryBuilder<any, any, RenderableDiff>;
};

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
	readonly key: ViewKey;
	readonly label: string;
	readonly description: string;
	readonly icon: LucideIcon;
	readonly activate?: (args: {
		context: ViewContext;
		instance: ViewInstance;
	}) => void | (() => void);
	readonly render: (args: {
		context: ViewContext;
		instance: ViewInstance;
		target: HTMLElement;
	}) => void | (() => void);
}

/**
 * Context passed to views for interacting with the layout.
 *
 * @example
 * context.onOpenFile?.("file-123", { focus: false, filePath: "/docs/guide.md" });
 * context.onOpenDiff?.("file-123", "/docs/guide.md");
 */
export interface ViewContext {
	readonly onOpenFile?: (
		fileId: string,
		options?: {
			/**
			 * Whether the central panel should receive focus when the file opens.
			 * Defaults to `true` for backwards compatibility.
			 */
			readonly focus?: boolean;
			/**
			 * Optional absolute workspace path for the file. When provided, the
			 * layout uses it to label the tab and avoid an extra lookup.
			 */
			readonly filePath?: string;
		},
	) => Promise<void> | void;
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
	readonly setTabBadgeCount: (count: number | null | undefined) => void;
	readonly lix: Lix;
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
