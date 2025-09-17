import * as React from "react";
import { useKeyValue } from "@/key-value/use-key-value";
import { useQuery, useQueryTakeFirst } from "@lix-js/react-utils";
import { selectVersionDiff, type RenderDiffArgs } from "@lix-js/sdk";
import { Diff } from "@/components/diff";
import { plugin as mdPlugin } from "@lix-js/plugin-md";

type ViewMode = "unified" | "side-by-side";

/**
 * Read-only Diff View that mirrors editor layout and renders plugin-based diffs.
 * Base is 'main', head is the active version; scoped to the active file.
 *
 * @example
 * <DiffView />
 */
export function DiffView() {
	const [view] = useKeyValue("flashtype_diff_view", {
		defaultVersionId: "global",
		untracked: true,
	});
	const mode: ViewMode = (view as ViewMode) ?? "unified";

	const activeVersion = useQueryTakeFirst(({ lix }) =>
		lix.db.selectFrom("active_version").select(["version_id"]).limit(1),
	);
	const [explicitSource] = useKeyValue("flashtype_diff_source_version_id", {
		defaultVersionId: "global",
		untracked: true,
	});
	const mainVersion = useQueryTakeFirst(({ lix }) =>
		lix.db
			.selectFrom("version")
			.where("name", "=", "main")
			.select(["id"]) // use concrete id string
			.limit(1),
	);

	// Build the diff query once both version ids are known
	const diffs = useQuery(({ lix }) => {
		const sourceId =
			(explicitSource as string | null) ??
			(activeVersion!.version_id as unknown as string);
		const q = selectVersionDiff({
			lix,
			source: { id: sourceId }, // head
			target: { id: mainVersion!.id as unknown as string }, // base (main)
		})
			// Restrict to active file
			.where(
				"diff.file_id",
				"=",
				lix.db
					.selectFrom("key_value")
					.where("key", "=", "flashtype_active_file_id")
					.select("value"),
			)
			.orderBy("diff.entity_id")
			.innerJoin("change as after", "after.id", "after_change_id")
			.leftJoin("change as before", "before.id", "before_change_id")
			.where("after.plugin_key", "=", mdPlugin.key)
			.select([
				"diff.entity_id",
				"diff.schema_key",
				(eb) => eb.ref("diff.status").as("status"),
				(eb) => eb.ref("after.plugin_key").as("plugin_key"),
				(eb) => eb.ref("before.snapshot_content").as("before_snapshot_content"),
				(eb) => eb.ref("after.snapshot_content").as("after_snapshot_content"),
			]);
		return q;
	});

	const diffArray = Array.isArray(diffs) ? (diffs as any[]) : [];
	const hasChanges = diffArray.some((d) => d.status !== "unchanged");
	const renderDiffs = diffArray as unknown as RenderDiffArgs["diffs"];

	return (
		<div>
			<div className="w-full bg-background px-3 py-0">
				<div className="w-full max-w-5xl mx-auto">
					{!hasChanges ? (
						<div className="text-sm text-muted-foreground p-3">
							No differences for this file between this version and main.
						</div>
					) : (
						// Plugin-rendered diff component
						<Diff
							diffs={renderDiffs}
							contentClassName={
								mode === "unified" ? "ProseMirror" : "ProseMirror"
							}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
