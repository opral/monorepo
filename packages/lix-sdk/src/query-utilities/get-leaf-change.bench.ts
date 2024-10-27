/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 } from "uuid";
import { bench, describe } from "vitest";
import {
	getLeafChange,
	newLixFile,
	openLixInMemory,
	type Change,
	type ChangeGraphEdge,
	type NewChange,
	type NewSnapshot,
} from "../index.js";

const createChange = (
	type: "bundle" | "message" | "variant",
	payload: any,
	parentChangeId: string | null,
): { change: NewChange; snapshot: NewSnapshot; edges: ChangeGraphEdge[] } => {
	const entityId = payload[type].id;
	const snapshotId = v4();
	const snapshot: NewSnapshot = {
		id: snapshotId,
		content: payload[type],
	};
	const change: Change = {
		id: v4(),
		file_id: "mock",
		plugin_key: "inlang",
		type: type,
		snapshot_id: snapshotId,
		entity_id: entityId,
		created_at: "",
	};

	const edges: ChangeGraphEdge[] = [];

	if (parentChangeId) {
		edges.push({
			parent_id: parentChangeId,
			child_id: change.id,
		});
	}

	return {
		change,
		snapshot,
		edges,
	};
};

const setupLix = async (nMessages: number) => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockChanges: {
		change: NewChange;
		snapshot: NewSnapshot;
		edges: ChangeGraphEdge[];
	}[] = [];

	for (let i = 0; i < nMessages; i++) {
		const payloads = getPayloadsForId(v4());

		// lets asume we create a bundle once and don't change it to much over its lifetime
		mockChanges.push(createChange("bundle", payloads, null));

		// lets asume we add 4 languages to the message and don't change it to much
		// -> 6 changes
		let lastMessageChangeId: null | string = null;
		for (let i = 0; i < 6; i++) {
			const changeAndSnapshot = createChange(
				"message",
				payloads,
				lastMessageChangeId,
			);
			mockChanges.push(changeAndSnapshot);
			lastMessageChangeId = changeAndSnapshot.change.id!;
		}

		// lets assume imports some variants once (1) change and others get edited quit heavly 120 characters 10 times rewriten (1200 changes)
		// -> 100 changes per variant
		createChange("variant", payloads, null);
		let lastVariantChangeId: null | string = null;
		for (let i = 0; i < 100; i++) {
			const changeAndSnapshot = createChange(
				"variant",
				payloads,
				lastVariantChangeId,
			);
			mockChanges.push(changeAndSnapshot);
			lastVariantChangeId = changeAndSnapshot.change.id!;
		}
	}

	const firstChangeId = mockChanges[0]!.change.id;

	const batchSize = 256;
	// Insert changes in batches
	for (let i = 0; i < mockChanges.length; i += batchSize) {
		// Extract the changes
		const changesArray = mockChanges
			.slice(i, i + batchSize)
			.map((item) => item.change);

		// Extract the snapshots
		const snapshotsArray = mockChanges
			.slice(i, i + batchSize)
			.map((item) => item.snapshot);

		const edgesArray = mockChanges
			.slice(i, i + batchSize)
			.flatMap((item) => item.edges);

		await lix.db.insertInto("snapshot").values(snapshotsArray).execute();
		await lix.db.insertInto("change").values(changesArray).execute();
		await lix.db.insertInto("change_graph_edge").values(edgesArray).execute();
	}
	// console.log("setting up lix with " + nMessages + ".... done");

	return { lix, firstChangeId };
};

for (let i = 0; i < 5; i++) {
	const nMessages = Math.pow(10, i);
	describe(
		"get Leaf Change " +
			nMessages +
			" messages -> " +
			nMessages * (1 + 6 + 100) +
			" changes",
		async () => {
			const project = await setupLix(nMessages);
			bench("getLeafChange", async () => {
				await getLeafChange({
					lix: project.lix,
					change: { id: project.firstChangeId } as Change,
				});
			});
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
