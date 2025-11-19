import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";
import { createChangeProposal } from "./create-change-proposal.js";
import { rejectChangeProposal } from "./reject-change-proposal.js";

test("rejectChangeProposal updates base change_proposal status", async () => {
	const lix = await openLix({});

	const main = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	const stage = await createVersion({
		lix,
		from: main,
		name: "cp_stage_reject_status",
	});

	const cp = await createChangeProposal({ lix, source: stage, target: main });

	await rejectChangeProposal({ lix, proposal: cp });

	const updated = await lix.db
		.selectFrom("change_proposal")
		.where("id", "=", cp.id)
		.select(["status"])
		.executeTakeFirst();

	expect(updated).toBeDefined();
	expect(updated?.status).toBe("rejected");
});
