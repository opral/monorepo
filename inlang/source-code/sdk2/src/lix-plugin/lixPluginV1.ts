import type { DiffReport, LixPlugin } from "@lix-js/sdk";
import { Bundle, Message, Variant } from "../schema/schemaV2.js";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";

export const lixPluginV1: LixPlugin<{
	bundle: Bundle;
	message: Message;
	variant: Variant;
}> = {
	key: "inlang-lix-plugin-v1",
	glob: "*",
	// TODO
	// idea:
	//   1. runtime reflection for lix on the change schema
	//   2. lix can validate the changes based on the schema
	// schema: {
	// 	bundle: Bundle,
	// 	message: Message,
	// 	variant: Variant,
	// },
	diff: {
		// TODO does not account for deletions
		file: async ({ old, neu }) => {
			const result: DiffReport[] = [];
			const oldProject = old
				? await loadProjectInMemory({ blob: new Blob([old]) })
				: undefined;
			const newProject = await loadProjectInMemory({ blob: new Blob([neu]) });
			const newProjectBundles = await newProject.db
				.selectFrom("bundle")
				.selectAll()
				.execute();
			const newProjectMessages = await newProject.db
				.selectFrom("message")
				.selectAll()
				.execute();
			const newProjectVariants = await newProject.db
				.selectFrom("variant")
				.selectAll()
				.execute();

			for (const bundle of newProjectBundles) {
				const oldBundle = await oldProject?.db
					.selectFrom("bundle")
					.selectAll()
					.where("id", "=", bundle.id)
					.executeTakeFirst();
				result.push(
					...(await lixPluginV1.diff.bundle({ old: oldBundle, neu: bundle }))
				);
			}
			for (const message of newProjectMessages) {
				const oldMessage = await oldProject?.db
					.selectFrom("message")
					.selectAll()
					.where("id", "=", message.id)
					.executeTakeFirst();

				result.push(
					...(await lixPluginV1.diff.message({ old: oldMessage, neu: message }))
				);
			}
			for (const variant of newProjectVariants) {
				const oldVariant = await oldProject?.db
					.selectFrom("variant")
					.selectAll()
					.where("id", "=", variant.id)
					.executeTakeFirst();
				result.push(
					...(await lixPluginV1.diff.variant({ old: oldVariant, neu: variant }))
				);
			}
			return result;
		},
		bundle: ({ old, neu }) =>
			jsonStringifyComparison({ old, neu, type: "bundle" }),
		message: ({ old, neu }) =>
			jsonStringifyComparison({ old, neu, type: "message" }),
		variant: ({ old, neu }) =>
			jsonStringifyComparison({ old, neu, type: "variant" }),
	},
};

function jsonStringifyComparison({
	old,
	neu,
	type,
}: {
	old?: Bundle | Message | Variant;
	neu: Bundle | Message | Variant;
	type: "bundle" | "message" | "variant";
}): DiffReport[] {
	if (old === undefined && neu) {
		return [{ type, value: neu }];
	} else if (old && neu === undefined) {
		throw new Error(
			"Deletions are not supported yet. https://github.com/opral/monorepo/pull/3043"
		);
	}
	const hasDiff = JSON.stringify(old) !== JSON.stringify(neu);
	if (hasDiff) {
		return [{ type, value: neu }];
	} else {
		return [];
	}
}
