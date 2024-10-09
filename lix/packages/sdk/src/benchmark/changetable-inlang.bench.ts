import { v4 } from "uuid";
import { afterEach, beforeEach, bench, describe } from "vitest";
import {
	getLeafChange,
	newLixFile,
	openLixInMemory,
	type Change,
} from "../index.js";

const createChange = (
	type: "bundle" | "message" | "variant",
	payload: any,
	parentChangeId?: string,
) => {
	const change: Change = {
		id: v4(),
		parent_id: parentChangeId,
		operation: "create",
		file_id: "mock",
		plugin_key: "inlang",
		type: type,
		// @ts-expect-error - type error in lix
		value: JSON.stringify(payload[type]),
	};
	return change;
};

const setupLix = async (nMessages: number) => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockChanges: Change[] = [];

	for (let i = 0; i < nMessages; i++) {
		const payloads = getPayloadsForId(v4());
		
		// lets asume we create a bundle once and don't change it to much over its lifetime
		createChange("bundle", payloads);

		// lets asume we add 4 languages to the message and don't change it to much
		// -> 6 changes
		let lastMessageChangeId: undefined | string = undefined;
		for (let i = 0; i < 6; i++) {
			const change = createChange("message", payloads, lastMessageChangeId);
			mockChanges.push(change)
			lastMessageChangeId = change.id
		}

		// lets assume imports some variants once (1) change and others get edited quit heavly 120 characters 10 times rewriten (1200 changes)
		// -> 100 changes per variant
		createChange("variant", payloads);
		let lastVariantChangeId: undefined | string = undefined;
		for (let i = 0; i < 100; i++) {
			const change = createChange("variant", payloads, lastVariantChangeId);
			mockChanges.push(change)
			lastVariantChangeId = change.id
		}
	}

	const firstChangeId = mockChanges[0]!.id

	const batchSize = 256;
	// Insert changes in batches
	for (let i = 0; i < mockChanges.length; i += batchSize) {
		const batch = mockChanges.slice(i, i + batchSize);
		await lix.db.insertInto("change").values(batch).executeTakeFirst();
	}
	// await lix.db.insertInto("change").values(mockChanges).executeTakeFirst();

	return { lix, firstChangeId };
};

async function wait(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, ms); // 1000 milliseconds = 1 second
	});
}

for (let i = 0; i < 4; i++) {
	const nMessages = Math.pow(10, i);
	describe(
		"select changes via on " +
			nMessages +
			" messages -> " + nMessages * (1+6+100) + " changes",
		async () => {
			let project = await setupLix(nMessages);

			bench("payload->property", async () => {
				let result = await project.lix.db
					.selectFrom("change")
					.selectAll()
					.where(
						(eb) => eb.ref("value", "->>").key("resizingConstraint"),
						"=",
						100,
					)

					.executeTakeFirst();

				// console.log(result)
			});

			bench("column", async () => {
				let result = await project.lix.db
					.selectFrom("change")
					.selectAll()
					.where("plugin_key", "=", "mock1")

					.executeTakeFirst();

				// console.log(result)
			});

			bench(
				"getLeafNode",
				async () => {
					await getLeafChange({
						lix: project.lix,
						change: { id: project.firstChangeId } as Change,
					});

					// console.log(result)
				},
				{
					iterations: 2,
				},
			);
		},
	);
}

const getPayloadsForId = (id: string) => {
	return {
		bundle: {
			id: id,
			declarations: [
				{
					type: "input-variable",
					name: "name",
				},
			],
		},
		message: {
			id: id + "_en",
			bundleId: id,
			locale: "en",
			selectors: [],
		},
		variant: {
			id: id + "_en_variant_one",
			messageId: "depressed_dog_en",
			matches: [],
			pattern: [
				{ type: "text", value: "Good morning " },
				{
					type: "expression",
					arg: { type: "variable-reference", name: "name" },
				},
				{ type: "text", value: "!" },
			],
		},
	};
};
