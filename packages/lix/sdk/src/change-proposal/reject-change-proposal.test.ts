import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";
import { createChangeProposal } from "./create-change-proposal.js";
import { rejectChangeProposal } from "./reject-change-proposal.js";

function enc(s: string) {
	return new TextEncoder().encode(s);
}

test("rejectChangeProposal deletes proposal first, then deletes source version (no merge)", async () => {
	const lix = await openLix({});

	const main = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create source version and make a change only there
	const stage = await createVersion({
		lix,
		from: main,
		name: "cp_stage_reject_spec",
	});

	await lix.db
		.insertInto("file_by_version")
		.values({
			path: "/reject-spec.md",
			data: enc("hello"),
			lixcol_version_id: stage.id,
		})
		.execute();

	const cp = await createChangeProposal({ lix, source: stage, target: main });

	await rejectChangeProposal({ lix, proposal: cp });

	// Source version should be deleted
	const stageExists = await lix.db
		.selectFrom("version")
		.where("id", "=", stage.id)
		.select("id")
		.executeTakeFirst();
	expect(stageExists).toBeUndefined();

	// File should NOT be present in main after reject
	const fileInMain = await lix.db
		.selectFrom("file_by_version")
		.where("path", "=", "/reject-spec.md")
		.where("lixcol_version_id", "=", main.id)
		.selectAll()
		.executeTakeFirst();
	expect(fileInMain).toBeUndefined();

	// Proposal should be removed after rejection (FK-safe)
	const cpAfter = await lix.db
		.selectFrom("change_proposal")
		.where("id", "=", cp.id)
		.selectAll()
		.executeTakeFirst();
	expect(cpAfter).toBeUndefined();
});
