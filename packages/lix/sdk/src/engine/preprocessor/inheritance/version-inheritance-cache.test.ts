import { expect, test } from "vitest";
import { getVersionInheritanceSnapshot } from "./version-inheritance-cache.js";
import type { StateCommitChange } from "../../../hooks/create-hooks.js";
import { openLix } from "../../../lix/open-lix.js";
import { createVersion } from "../../../version/create-version.js";

const descriptorSchemaKey = "lix_version_descriptor";

const makeDescriptorStateChange = (
	versionId: string,
	inheritsFrom: string | null,
	options?: { tombstone?: boolean }
): StateCommitChange => ({
	id: `change-${versionId}-${options?.tombstone ? "delete" : "upsert"}`,
	entity_id: versionId,
	schema_key: descriptorSchemaKey,
	schema_version: "1.0",
	file_id: "lix",
	plugin_key: "lix_own_entity",
	created_at: new Date().toISOString(),
	snapshot_content: options?.tombstone
		? null
		: {
				id: versionId,
				inherits_from_version_id: inheritsFrom,
			},
	version_id: "global",
	commit_id: `commit-${versionId}`,
	writer_key: null,
	untracked: 0,
	metadata: null,
});

const emitDescriptorChange = (
	engine: NonNullable<Awaited<ReturnType<typeof openLix>>["engine"]>,
	change: StateCommitChange
) => {
	engine.hooks._emit("state_commit", { changes: [change] });
};

test("applies descriptor inserts emitted via onStateCommit", async () => {
	const lix = await openLix({});
	const engine = lix.engine!;
	// Initialize snapshot (also bootstraps & subscribes)
	getVersionInheritanceSnapshot({ engine });

	emitDescriptorChange(engine, makeDescriptorStateChange("global", null));
	emitDescriptorChange(
		engine,
		makeDescriptorStateChange("active_version", "global")
	);
	emitDescriptorChange(
		engine,
		makeDescriptorStateChange("feature_branch", "active_version")
	);

	const snapshot = getVersionInheritanceSnapshot({ engine });
	const feature = snapshot.get("feature_branch");
	expect(feature?.ancestors).toEqual(["active_version", "global"]);

	await lix.close();
});

test("subscription updates ancestry when parents change", async () => {
	const lix = await openLix({});
	const engine = lix.engine!;
	getVersionInheritanceSnapshot({ engine });

	emitDescriptorChange(engine, makeDescriptorStateChange("global", null));
	emitDescriptorChange(
		engine,
		makeDescriptorStateChange("active_version", "global")
	);
	emitDescriptorChange(
		engine,
		makeDescriptorStateChange("feature_branch", "active_version")
	);

	emitDescriptorChange(
		engine,
		makeDescriptorStateChange("feature_branch", "global")
	);

	const snapshot = getVersionInheritanceSnapshot({ engine });
	const feature = snapshot.get("feature_branch");
	expect(feature?.ancestors).toEqual(["global"]);
	expect(feature?.inheritsFromVersionId).toBe("global");

	await lix.close();
});

test("subscription removes nodes when tombstones arrive", async () => {
	const lix = await openLix({});
	const engine = lix.engine!;
	getVersionInheritanceSnapshot({ engine });

	emitDescriptorChange(engine, makeDescriptorStateChange("global", null));
	emitDescriptorChange(
		engine,
		makeDescriptorStateChange("active_version", "global")
	);

	emitDescriptorChange(
		engine,
		makeDescriptorStateChange("active_version", null, { tombstone: true })
	);

	const snapshot = getVersionInheritanceSnapshot({ engine });
	expect(snapshot.get("active_version")).toBeUndefined();

	await lix.close();
});

test("bootstrap snapshot includes existing descriptor rows", async () => {
	const lix = await openLix({});
	await createVersion({
		lix,
		id: "integration_child",
		inheritsFrom: { id: "global" },
		name: "integration child",
	});

	const snapshot = getVersionInheritanceSnapshot({ engine: lix.engine! });
	const child = snapshot.get("integration_child");
	expect(child?.ancestors).toEqual(["global"]);

	await lix.close();
});
