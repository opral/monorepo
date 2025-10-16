import { describe, expect, test } from "vitest";
import { createChangeProposalToolExec } from "./create-change-proposal.js";
import { createVersion, openLix } from "@lix-js/sdk";

async function getMainVersionId(
	lix: Awaited<ReturnType<typeof openLix>>
): Promise<string> {
	const main = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.select("id")
		.executeTakeFirstOrThrow();
	return main.id as unknown as string;
}

describe("create_change_proposal tool", () => {
	test("creates a proposal targeting main by default", async () => {
		const lix = await openLix({});
		const source = await createVersion({ lix, name: "feature-a" });
		const mainId = await getMainVersionId(lix);

		const result = await createChangeProposalToolExec({
			lix,
			input: {
				sourceVersionId: source.id as string,
				targetVersionId: mainId,
			},
		});

		expect(result.sourceVersionId).toBe(source.id);
		expect(result.targetVersionId).toBe(mainId);
		expect(result.status).toBe("open");
		expect(result.id).toBeTruthy();
	});

	test("throws when a proposal already exists for the pair", async () => {
		const lix = await openLix({});
		const source = await createVersion({ lix, name: "feature-b" });
		const mainId = await getMainVersionId(lix);

		await createChangeProposalToolExec({
			lix,
			input: {
				sourceVersionId: source.id as string,
				targetVersionId: mainId,
			},
		});

		await expect(
			createChangeProposalToolExec({
				lix,
				input: {
					sourceVersionId: source.id as string,
					targetVersionId: mainId,
				},
			})
		).rejects.toThrow(/Active proposal already exists/);
	});

	test("supports custom targetVersionId", async () => {
		const lix = await openLix({});
		const source = await createVersion({ lix, name: "feature-c" });
		const target = await createVersion({ lix, name: "review-target" });

		const result = await createChangeProposalToolExec({
			lix,
			input: {
				sourceVersionId: source.id as string,
				targetVersionId: target.id as string,
			},
		});

		expect(result.sourceVersionId).toBe(source.id);
		expect(result.targetVersionId).toBe(target.id);
	});
});
