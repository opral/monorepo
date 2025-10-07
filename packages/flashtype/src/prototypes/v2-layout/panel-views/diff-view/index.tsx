import { useMemo } from "react";
import { useQuery } from "@lix-js/react-utils";
import { selectWorkingDiff } from "@lix-js/sdk";
import type { Lix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import { Diff } from "@/components/diff";
import type { DiffViewConfig, RenderableDiff } from "../../types";

interface DiffPanelViewProps {
	readonly config?: DiffViewConfig;
}

export function DiffPanelView({ config }: DiffPanelViewProps) {
	const queryFactory = useMemo(() => {
		if (!config?.query) {
			return ({ lix }: { lix: Lix }) => emptyDiffQuery(lix);
		}
		const query = config.query;
		return (ctx: { lix: Lix }) => query(ctx);
	}, [config]);

	const rawDiffs = useQuery<RenderableDiff>(queryFactory);

	const diffs = useMemo<RenderableDiff[]>(() => {
		if (!Array.isArray(rawDiffs) || rawDiffs.length === 0) return [];
		return rawDiffs.map((diff) => ({
			...diff,
			plugin_key: diff.plugin_key ?? mdPlugin.key,
			before_snapshot_content: normalizeSnapshot(diff.before_snapshot_content),
			after_snapshot_content: normalizeSnapshot(diff.after_snapshot_content),
		}));
	}, [rawDiffs]);

	if (!config?.query) {
		return (
			<div className="flex h-full items-center justify-center px-4 py-6 text-sm text-muted-foreground">
				Diff view is unavailable for this tab.
			</div>
		);
	}

	if (diffs.length === 0) {
		return (
			<div className="p-3 text-sm text-muted-foreground">
				No differences detected for this source.
			</div>
		);
	}

	return <Diff diffs={diffs} contentClassName="ProseMirror" />;
}

function emptyDiffQuery(lix: Lix) {
	return selectWorkingDiff({ lix })
		.where("diff.entity_id", "=", "__empty_diff__")
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
		.$castTo<RenderableDiff>();
}

function normalizeSnapshot(snapshot: unknown): Record<string, any> | null {
	if (snapshot === null || snapshot === undefined) return null;
	if (typeof snapshot === "string") {
		try {
			const parsed = JSON.parse(snapshot);
			return isRecord(parsed) ? parsed : null;
		} catch (error) {
			console.warn("Failed to parse snapshot content", error);
			return null;
		}
	}
	if (typeof Uint8Array !== "undefined" && snapshot instanceof Uint8Array) {
		try {
			const parsed = JSON.parse(new TextDecoder().decode(snapshot));
			return isRecord(parsed) ? parsed : null;
		} catch (error) {
			console.warn("Failed to decode snapshot content", error);
			return null;
		}
	}
	if (isRecord(snapshot)) {
		return snapshot;
	}
	return null;
}

function isRecord(value: unknown): value is Record<string, any> {
	return typeof value === "object" && value !== null;
}
