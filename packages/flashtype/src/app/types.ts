import type { LucideIcon } from "lucide-react";
import type { Lix } from "@lix-js/sdk";
import type { SelectQueryBuilder } from "@lix-js/sdk/dependency/kysely";

/**
 * Union of registry keys for views available in the layout.
 *
 * @example
 * const activeView: ViewKind = "flashtype_files";
 */
export type ViewKind = string;

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
 * Per-panel instance props used to track which views are open.
 *
 * @example
 * const instance: ViewInstance = { instance: "files-1", kind: "flashtype_files" };
 */
export interface ViewInstanceProps {
	readonly filePath?: string;
	readonly label?: string;
	readonly checkpointId?: string;
	readonly fileId?: string;
	readonly diff?: DiffViewConfig;
	readonly [key: string]: unknown;
}

export interface ViewInstance {
	readonly instance: string;
	readonly kind: ViewKind;
	readonly isPending?: boolean;
	readonly props?: ViewInstanceProps;
}

/**
 * Shape of the static metadata that powers the view switcher UI.
 *
 * @example
 * const filesView: ViewDefinition = VIEW_DEFINITIONS[0];
 */
export interface ViewDefinition {
	readonly kind: ViewKind;
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
 * The host sets `isActiveView` when the view's tab is visible so consumers can
 * avoid mutating shared state while hidden.
 *
 * @example
 * context.openView?.({
 *   panel: "central",
 *   kind: "file-content",
 *   instance: "file-content:file-123",
 *   props: { fileId: "file-123", filePath: "/docs/guide.md" },
 *   pending: true,
 * });
 */
export interface ViewContext {
	readonly openView?: (args: {
		readonly panel: PanelSide;
		readonly kind: ViewKind;
		readonly props?: ViewInstanceProps;
		readonly focus?: boolean;
		readonly instance?: string;
		readonly pending?: boolean;
	}) => void;
	readonly closeView?: (args: {
		readonly panel?: PanelSide;
		readonly instance?: string;
		readonly kind?: ViewKind;
	}) => void;
	readonly isPanelFocused?: boolean;
	readonly setTabBadgeCount: (count: number | null | undefined) => void;
	readonly moveViewToPanel?: (
		targetPanel: PanelSide,
		instance?: string,
	) => void;
	readonly resizePanel?: (side: PanelSide, size: number) => void;
	readonly focusPanel?: (side: PanelSide) => void;
	readonly isActiveView?: boolean;
	readonly lix: Lix;
}

/**
 * Lightweight state container that represents one panel island.
 *
 * @example
 * const leftPanel: PanelState = { views: [], activeInstance: null };
 */
export interface PanelState {
	readonly views: ViewInstance[];
	readonly activeInstance: string | null;
}

/**
 * Declares the available sides that panels can mount on.
 *
 * @example
 * const side: PanelSide = "left";
 */
export type PanelSide = "left" | "right" | "central";
