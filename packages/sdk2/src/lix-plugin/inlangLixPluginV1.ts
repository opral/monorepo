import type { Conflict, DiffReport, LixPlugin } from "@lix-js/sdk";
import { Bundle, Message, Variant } from "../schema/schemaV2.js";
import { loadDatabaseInMemory } from "sqlite-wasm-kysely";
import { initKysely } from "../database/initKysely.js";
import { getLastChildOfChange } from "./getLastChildOfChange.js";
import { getFirstCommonParent } from "./getFirstCommonParent.js";
import { getChangesNotInTarget } from "./getChangesNotInTarget.js";

export const inlangLixPluginV1: LixPlugin<{
	bundle: Bundle;
	message: Message;
	variant: Variant;
}> = {
	key: "inlang-lix-plugin-v1",
	glob: "*",
	reportConflicts: async ({ sourceLix, targetLix }) => {
		const result: Conflict[] = [];
		const changesNotInTarget = await getChangesNotInTarget({
			sourceLix,
			targetLix,
		});
		for (const change of changesNotInTarget) {
			const commonParent = await getFirstCommonParent({
				sourceChange: change,
				sourceLix,
				targetLix,
			});

			if (commonParent === undefined) {
				// no common parent, no conflict. must be an insert
				continue;
			}

			const lastChangeInTarget = await getLastChildOfChange({
				change: commonParent,
				lix: targetLix,
			});

			const hasDiff =
				JSON.stringify(change.value) !==
				JSON.stringify(lastChangeInTarget.value);

			if (hasDiff === false) {
				// TODO we have two different changes that yielded the same snapshot,
				// lix or the plugin need to change the parents of the target change
				// to both the source and the target change. users likely want to
				// see that two "branches" led to the same snapshot
				continue;
			}

			// naive raise any snapshot difference as a conflict for now
			// more sophisticated conflict reporting can be incrementally added
			result.push({
				change_id: lastChangeInTarget.id,
				conflicts_with_change_id: change.id,
				reason:
					"The snapshots of the change do not match. More sophisticated reasoning will be added later.",
			});
		}
		return result;
	},
	diff: {
		// TODO does not account for deletions
		file: async ({ old, neu }) => {
			// can only handle the database for now
			if (neu === undefined || neu.path?.endsWith("db.sqlite") === false) {
				return [];
			}
			const result: DiffReport[] = [];
			const oldDb = old
				? initKysely({ sqlite: await loadDatabaseInMemory(old.data) })
				: undefined;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const newDb = neu
				? initKysely({
						sqlite: await loadDatabaseInMemory(neu.data),
				  })
				: undefined;

			const newProjectBundles = await newDb
				?.selectFrom("bundle")
				.selectAll()
				.execute();

			const newProjectMessages = await newDb
				?.selectFrom("message")
				.selectAll()
				.execute();
			const newProjectVariants = await newDb
				?.selectFrom("variant")
				.selectAll()
				.execute();

			for (const bundle of newProjectBundles ?? []) {
				const oldBundle = await oldDb
					?.selectFrom("bundle")
					.selectAll()
					.where("id", "=", bundle.id)
					.executeTakeFirst();
				result.push(
					...(await inlangLixPluginV1.diff.bundle({
						old: oldBundle,
						neu: bundle,
					}))
				);
			}
			for (const message of newProjectMessages ?? []) {
				const oldMessage = await oldDb
					?.selectFrom("message")
					.selectAll()
					.where("id", "=", message.id)
					.executeTakeFirst();

				result.push(
					...(await inlangLixPluginV1.diff.message({
						old: oldMessage,
						neu: message,
					}))
				);
			}
			for (const variant of newProjectVariants ?? []) {
				const oldVariant = await oldDb
					?.selectFrom("variant")
					.selectAll()
					.where("id", "=", variant.id)
					.executeTakeFirst();
				result.push(
					...(await inlangLixPluginV1.diff.variant({
						old: oldVariant,
						neu: variant,
					}))
				);
			}

			return result;
		},
		bundle: ({ old, neu }) => diffSnapshot({ old, neu, type: "bundle" }),
		message: ({ old, neu }) => diffSnapshot({ old, neu, type: "message" }),
		variant: ({ old, neu }) => diffSnapshot({ old, neu, type: "variant" }),
	},
};

function diffSnapshot({
	old,
	neu,
	type,
}: {
	old?: Bundle | Message | Variant;
	neu?: Bundle | Message | Variant;
	type: "bundle" | "message" | "variant";
}): DiffReport[] {
	if (old === undefined && neu) {
		return [{ type, old, neu, operation: "create" } satisfies DiffReport];
	} else if (old !== undefined && neu === undefined) {
		return [{ type, old, neu, operation: "delete" } satisfies DiffReport];
	} else if (old && neu) {
		const hasDiff = JSON.stringify(old) !== JSON.stringify(neu);
		if (hasDiff) {
			return [
				{
					type,
					operation: "update",
					old,
					neu,
				} satisfies DiffReport,
			];
		}
	}
	return [];
}
