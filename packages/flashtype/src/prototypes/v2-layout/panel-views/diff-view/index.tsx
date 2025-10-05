import { useMemo } from "react";
import { useQuery } from "@lix-js/react-utils";
import { selectWorkingDiff, sql } from "@lix-js/sdk";
import type { Lix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import { Diff } from "@/components/diff";
import type { DiffViewConfig, RenderableDiff } from "../../types";

interface DiffPanelViewProps {
	readonly config?: DiffViewConfig;
}

export function DiffPanelView({ config }: DiffPanelViewProps) {
	const rawDiffs = useQuery(
		({ lix }) => config?.query?.({ lix }) ?? emptyDiffQuery(lix),
		[config?.query],
	);

	const diffs = useMemo<RenderableDiff[]>(() => {
		if (!Array.isArray(rawDiffs) || rawDiffs.length === 0) return [];
		return (rawDiffs as RenderableDiff[]).map((diff) => ({
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
		.where(sql`1 = 0`)
		.select((eb) => [
			eb.val<string>("").as("entity_id"),
			eb.val<string>("").as("schema_key"),
			eb.val("unchanged").as("status"),
			eb.val(null).as("before_snapshot_content"),
			eb.val(null).as("after_snapshot_content"),
			eb.val(mdPlugin.key).as("plugin_key"),
		])
		.$castTo<RenderableDiff>();
}

function normalizeSnapshot(snapshot: unknown): unknown {
	if (snapshot === null || snapshot === undefined) return undefined;
	if (typeof snapshot === "string") {
		try {
			const parsed = JSON.parse(snapshot);
			return typeof parsed === "object" && parsed !== null ? parsed : undefined;
		} catch (error) {
			console.warn("Failed to parse snapshot content", error);
			return undefined;
		}
	}
	if (
		typeof Uint8Array !== "undefined" &&
		snapshot instanceof Uint8Array
	) {
		try {
			const parsed = JSON.parse(new TextDecoder().decode(snapshot));
			return typeof parsed === "object" && parsed !== null ? parsed : undefined;
		} catch (error) {
			console.warn("Failed to decode snapshot content", error);
			return undefined;
		}
	}
	if (typeof snapshot === "object" && snapshot !== null && "type" in snapshot) {
		return snapshot;
	}
	return undefined;
}
