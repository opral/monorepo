import { selectWorkingDiff } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import type { DiffViewConfig, RenderableDiff, ViewKind } from "./types";

export const AGENT_VIEW_KIND = "flashtype_agent" as ViewKind;
export const FILES_VIEW_KIND = "flashtype_files" as ViewKind;
export const SEARCH_VIEW_KIND = "flashtype_search" as ViewKind;
export const TASKS_VIEW_KIND = "flashtype_tasks" as ViewKind;
export const CHECKPOINT_VIEW_KIND = "flashtype_checkpoint" as ViewKind;
export const FILE_VIEW_KIND = "flashtype_file" as ViewKind;
export const DIFF_VIEW_KIND = "flashtype_diff" as ViewKind;
export const COMMIT_VIEW_KIND = "flashtype_commit" as ViewKind;
export const HISTORY_VIEW_KIND = "flashtype_history" as ViewKind;

export const fileViewInstance = (fileId: string): string =>
	`${FILE_VIEW_KIND}:${fileId}`;

export const diffViewInstance = (fileId: string): string =>
	`${DIFF_VIEW_KIND}:${fileId}`;

export const commitViewInstance = (checkpointId: string): string =>
	`${COMMIT_VIEW_KIND}:${checkpointId}`;

export const historyViewInstance = (scope = "primary"): string =>
	`${HISTORY_VIEW_KIND}:${scope}`;

export function decodeURIComponentSafe(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

export function diffLabelFromPath(filePath?: string): string | undefined {
	if (!filePath) return undefined;
	const encodedLabel = filePath.split("/").filter(Boolean).pop();
	return encodedLabel ? decodeURIComponentSafe(encodedLabel) : undefined;
}

export function fileLabelFromPath(
	filePath?: string,
	fallbackLabel?: string,
): string {
	const derived = diffLabelFromPath(filePath);
	if (derived) return derived;
	if (filePath) return filePath;
	return fallbackLabel ?? "Untitled";
}

export function buildFileViewProps(args: {
	fileId: string;
	filePath?: string;
	label?: string;
}) {
	const label = args.label ?? fileLabelFromPath(args.filePath, args.fileId);
	return args.filePath
		? {
				fileId: args.fileId,
				filePath: args.filePath,
				flashtype: { label },
			}
		: { fileId: args.fileId, flashtype: { label } };
}

export function createWorkingVsCheckpointDiffConfig(
	fileId: string,
	title: string,
): DiffViewConfig {
	return {
		title,
		query: ({ lix }) =>
			selectWorkingDiff({ lix })
				.where("diff.file_id", "=", fileId)
				.orderBy("diff.entity_id")
				.leftJoin("change as after", "after.id", "diff.after_change_id")
				.leftJoin("change as before", "before.id", "diff.before_change_id")
				.select((eb) => [
					eb.ref("diff.entity_id").as("entity_id"),
					eb.ref("diff.schema_key").as("schema_key"),
					eb.ref("diff.status").as("status"),
					eb.ref("before.snapshot_content").as("before_snapshot_content"),
					eb.ref("after.snapshot_content").as("after_snapshot_content"),
					eb.fn
						.coalesce(
							eb.ref("after.plugin_key"),
							eb.ref("before.plugin_key"),
							eb.val(mdPlugin.key),
						)
						.as("plugin_key"),
				])
				.$castTo<RenderableDiff>(),
	};
}

export function buildDiffViewProps(args: {
	fileId: string;
	filePath: string;
	label?: string;
	diffConfig?: DiffViewConfig;
}) {
	const label = args.label ?? diffLabelFromPath(args.filePath) ?? args.filePath;
	const diff =
		args.diffConfig ?? createWorkingVsCheckpointDiffConfig(args.fileId, label);
	return {
		fileId: args.fileId,
		filePath: args.filePath,
		flashtype: { label },
		diff,
	};
}
