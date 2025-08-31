import { expect, test } from "vitest";
import { transition } from "./transition.js";
import { createVersionFromCommit } from "../version/create-version-from-commit.js";
import { switchVersion } from "../version/switch-version.js";
import { createCheckpoint } from "./create-checkpoint.js";
import { simulationTest } from "../test-utilities/simulation-test/simulation-test.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";

test("simulation test discovery", () => {});

simulationTest(
	"transition creates a new commit, links parents, updates active version, and restores user + file state",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// first checkpoint (checkpoint0)
		await lix.db
			.insertInto("key_value")
			.values({ key: "a", value: "1" })
			.execute();

		// Create a file with initial content in the same checkpoint
		const enc = new TextEncoder();

		await lix.db
			.insertInto("file")
			.values({ id: "file1", path: "/a.txt", data: enc.encode("one") })
			.execute();

		const checkpoint0 = await createCheckpoint({ lix });

		// second checkpoint (checkpoint1)
		await lix.db
			.updateTable("key_value")
			.set({ value: "2" })
			.where("key", "=", "a")
			.execute();

		await lix.db
			.insertInto("key_value")
			.values({ key: "b", value: "x" })
			.execute();

		// Modify the file content in the same checkpoint
		await lix.db
			.updateTable("file")
			.set({ data: enc.encode("two") })
			.where("id", "=", "file1")
			.execute();

		const checkpoint1 = await createCheckpoint({ lix });

		// Transition back to checkpoint0
		const newCommit = await transition({ lix, to: checkpoint0 });

		// Active version should now point to newCommit
		const activeV = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();
		expect(activeV.commit_id).toBe(newCommit.id);

		// New commit should have two parents: source (checkpoint1) and target (checkpoint0)
        const parents = await lix.db
            .selectFrom("commit_edge")
            .where("child_id", "=", newCommit.id)
            .select(["parent_id"])
            .execute();

		const parentIds = parents.map((p: any) => p.parent_id).sort();

		expect(parentIds).toEqual([checkpoint1.id, checkpoint0.id].sort());

		// Verify user and file state match checkpoint0
		const aRow = await lix.db
			.selectFrom("key_value")
			.selectAll()
			.where("key", "=", "a")
			.executeTakeFirstOrThrow();

		expect(aRow.value).toBe("1");

		const bRow = await lix.db
			.selectFrom("key_value")
			.selectAll()
			.where("key", "=", "b")
			.executeTakeFirst();
		expect(bRow).toBeUndefined();

		const file = await lix.db
			.selectFrom("file")
			.selectAll()
			.where("id", "=", "file1")
			.executeTakeFirstOrThrow();
		const dec = new TextDecoder();

		expect(dec.decode(file.data)).toBe("one");
	}
);

simulationTest(
	"transition no-op when target equals current version commit",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({});
		await lix.db
			.insertInto("key_value")
			.values({ key: "k", value: "v1" })
			.execute();
		const checkpoint = await createCheckpoint({ lix });

		const version = await createVersionFromCommit({
			lix,
			name: "noop-test",
			commit: checkpoint,
		});

		// Record commit count immediately before transition
		const commitsBefore = await lix.db
			.selectFrom("commit")
			.select(({ fn }) => [fn.countAll<number>().as("c")])
			.executeTakeFirstOrThrow();

		const returned = await transition({ lix, to: checkpoint, version });
		expect(returned.id).toBe(checkpoint.id);

		const v = await lix.db
			.selectFrom("version")
			.selectAll()
			.where("id", "=", version.id)
			.executeTakeFirstOrThrow();
		expect(v.commit_id).toBe(checkpoint.id);

		// Verify no new commits were created by transition
		const commitsAfter = await lix.db
			.selectFrom("commit")
			.select(({ fn }) => [fn.countAll<number>().as("c")])
			.executeTakeFirstOrThrow();

		expect(Number((commitsAfter as any).c)).toBe(
			Number((commitsBefore as any).c)
		);
	}
);

simulationTest(
	"transition defaults to active version when versionId omitted",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({});

		await lix.db
			.insertInto("key_value")
			.values({ key: "n", value: "1" })
			.execute();

		const checkpoint0 = await createCheckpoint({ lix });

		await lix.db
			.updateTable("key_value")
			.set({ value: "2" })
			.where("key", "=", "n")
			.execute();

		const checkpoint1 = await createCheckpoint({ lix });

		const version = await createVersionFromCommit({
			lix,
			name: "active-transition",
			commit: checkpoint1,
		});

		await switchVersion({ lix, to: version });

		const resultCommit = await transition({ lix, to: checkpoint0 });

		const activeV = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		expect(activeV.id).toBe(version.id);
		expect(activeV.commit_id).toBe(resultCommit.id);
	}
);

simulationTest(
	"transition respects boundaries by file_id",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],

			providePlugins: [mockJsonPlugin],
		});

		// Create two JSON files where both have a shared property key
		await lix.db
			.insertInto("file")
			.values({
				id: "f1",
				path: "/a.json",
				data: new TextEncoder().encode(
					JSON.stringify({ shared: "A", keep: 1 })
				),
			})
			.execute();

		await lix.db
			.insertInto("file")
			.values({
				id: "f2",
				path: "/b.json",
				data: new TextEncoder().encode(
					JSON.stringify({ shared: "B", keep: 2 })
				),
			})
			.execute();

		// Baseline where both files have the shared property
		const checkpointBoth = await createCheckpoint({ lix });

		// Update only f2 to delete the shared property (keep other fields)
		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode(JSON.stringify({ keep: 2 })) })
			.where("id", "=", "f2")
			.execute();

		const checkpointMinusOne = await createCheckpoint({ lix });

		// Create a new version pinned at the baseline (both present) and switch to it
		const version = await createVersionFromCommit({
			lix,
			name: "multi-key-diff",
			commit: checkpointBoth,
		});
		await switchVersion({ lix, to: version });

		// Transition this version to the target that removed only f2's shared property
		await transition({ lix, to: checkpointMinusOne });

		// Verify file contents reflect deletion only in f2
		const decoder = new TextDecoder();
		const file1 = await lix.db
			.selectFrom("file")
			.selectAll()
			.where("id", "=", "f1")
			.executeTakeFirstOrThrow();
		const file2 = await lix.db
			.selectFrom("file")
			.selectAll()
			.where("id", "=", "f2")
			.executeTakeFirstOrThrow();

		const json1 = JSON.parse(decoder.decode(file1.data));
		const json2 = JSON.parse(decoder.decode(file2.data));

		expect(json1.shared).toBe("A");
		expect(json1.keep).toBe(1);
		expect(json2.shared).toBeUndefined();
		expect(json2.keep).toBe(2);

		// Additionally, check state_all shows only one leaf for entity_id 'shared' at this version
		const activeV = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		const sharedLeaves = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "mock_json_property")
			.where("entity_id", "=", "shared")
			.where("version_id", "=", activeV.id)
			.selectAll()
			.execute();

		expect(sharedLeaves).toHaveLength(1);
		expect(sharedLeaves[0]!.file_id).toBe("f1");
	}
);
