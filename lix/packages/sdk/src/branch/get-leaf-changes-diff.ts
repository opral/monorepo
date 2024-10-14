import type { Change, LixReadonly } from "@lix-js/sdk";
import type { LixPlugin } from "../plugin.js";
import { PluginMissingError } from "./errors.js";

export async function getLeafChangesDiff(args: {
	plugins: LixPlugin[];
	sourceDb: LixReadonly["db"];
	targetDb?: LixReadonly["db"];
	sourceBranchId: string;
	targetBranchId: string;
}): Promise<{ change: Change; obsolete: boolean; valueId: string }[]> {
	if (!args.targetDb) {
		args.targetDb = args.sourceDb;
	}

	const leafChangesInSource = await args.sourceDb
		.selectFrom("change_view")
		.selectAll()
		.where("branch_id", "=", args.sourceBranchId)
		.where(
			"id",
			"not in",
			// @ts-ignore - no idea what the type issue is
			args.sourceDb
				.selectFrom("change_view")
				.select("parent_id")
				.where("parent_id", "is not", undefined)
				.where("branch_id", "=", args.sourceBranchId)
				.distinct(),
		)
		.execute();

	const sourceChangesByValueId: Record<string, Change> = {};
	for (const change of leafChangesInSource) {
		if (!change.value) {
			const parentChange = await args.sourceDb
				.selectFrom("change")
				.selectAll()
				.where("id", "=", change.parent_id!)
				.executeTakeFirstOrThrow();

			sourceChangesByValueId[parentChange.value!.id]! = change;
		} else {
			sourceChangesByValueId[change.value.id] = change;
		}
	}

	const leafChangesInTarget = await args.targetDb
		.selectFrom("change_view")
		.selectAll()
		.where("branch_id", "=", args.targetBranchId)
		.where(
			"id",
			"not in",
			// @ts-ignore - no idea what the type issue is
			args.targetDb
				.selectFrom("change_view")
				.select("parent_id")
				.where("parent_id", "is not", undefined)
				.where("branch_id", "=", args.targetBranchId)
				.distinct(),
		)
		.execute();

	const obsolete = [];
	const targetChangesByValueId: Record<string, Change> = {};
	for (const change of leafChangesInTarget) {
		let valueId: string;
		if (!change.value) {
			const parentChange = await args.targetDb
				.selectFrom("change")
				.selectAll()
				.where("id", "=", change.parent_id!)
				.executeTakeFirstOrThrow();

			valueId = parentChange.value!.id;
		} else {
			valueId = change.value.id;
		}

		targetChangesByValueId[valueId] = change;

		if (!sourceChangesByValueId[valueId]) {
			obsolete.push({ change, obsolete: true, valueId });
		}
	}

	const plugin = args.plugins[0]!;
	const toChange = [];

	for (const [valueId, change] of Object.entries(sourceChangesByValueId)) {
		// @ts-ignore
		const targetChange = targetChangesByValueId[valueId];

		if (change.id === targetChange?.id) {
			continue;
		}

		// @ts-ignore
		const old = targetChangesByValueId[valueId] as Change | undefined;

		if (!plugin?.diff[change.type]) {
			throw new PluginMissingError({ type: change.type, handler: "diff" });
		}

		const diff = await plugin.diff[change.type]!({
			neu: change.value,
			old: old?.value,
		});

		if (diff.length) {
			toChange.push({ change: targetChange!, obsolete: false, valueId });
		}
	}

	return [...obsolete, ...toChange];
}
