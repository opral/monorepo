import { describe, expect, test } from "vitest";
import { createVersionToolExec } from "./create-version.js";
import { createVersion, openLix } from "@lix-js/sdk";

describe("create_version tool", () => {
	test("creates a version from the active base when fromVersionId is omitted", async () => {
		const lix = await openLix({});

		const result = await createVersionToolExec({
			lix,
			input: { name: "feature-1" },
		});

		expect(result.id).toBeTruthy();
		expect(result.name).toBe("feature-1");
	});

	test("branches from a specific version when fromVersionId is provided", async () => {
		const lix = await openLix({});
		const parent = await createVersion({ lix, name: "parent" });

		const result = await createVersionToolExec({
			lix,
			input: {
				name: "child",
				fromVersionId: parent.id as string,
			},
		});

		const parentCommit = await lix.db
			.selectFrom("version")
			.where("id", "=", parent.id as any)
			.select(["commit_id"])
			.executeTakeFirstOrThrow();

		const childCommit = await lix.db
			.selectFrom("version")
			.where("id", "=", result.id as any)
			.select(["commit_id"])
			.executeTakeFirstOrThrow();

		expect(childCommit.commit_id).toBe(parentCommit.commit_id);
	});
});
