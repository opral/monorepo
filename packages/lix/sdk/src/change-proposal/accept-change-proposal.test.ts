import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";
import { createChangeProposal } from "./create-change-proposal.js";
import { acceptChangeProposal } from "./accept-change-proposal.js";

function enc(s: string) {
	return new TextEncoder().encode(s);
}

test("acceptChangeProposal merges source into target, deletes proposal, then deletes source version", async () => {
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
		name: "cp_stage_accept_spec",
	});

	await lix.db
		.insertInto("file_all")
		.values({
			path: "/accept-spec.md",
			data: enc("hello"),
			lixcol_version_id: stage.id,
		})
		.execute();

	const cp = await createChangeProposal({ lix, source: stage, target: main });

	await acceptChangeProposal({ lix, proposal: cp });

	// Source version should be deleted
	const stageExists = await lix.db
		.selectFrom("version")
		.where("id", "=", stage.id)
		.select("id")
		.executeTakeFirst();
	expect(stageExists).toBeUndefined();

	// File should be present in main
	const fileInMain = await lix.db
		.selectFrom("file_all")
		.where("path", "=", "/accept-spec.md")
		.where("lixcol_version_id", "=", main.id)
		.selectAll()
		.executeTakeFirst();
	expect(fileInMain).toBeDefined();

	// Proposal should be removed after acceptance (FK-safe deletion order)
	const cpAfter = await lix.db
		.selectFrom("change_proposal")
		.where("id", "=", cp.id)
		.selectAll()
		.executeTakeFirst();
	expect(cpAfter).toBeUndefined();
});
