import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";
import { createChangeProposal } from "./create-change-proposal.js";

test("createChangeProposal creates a global, open proposal with correct refs", async () => {
	const lix = await openLix({});

	// Resolve main and create a source version
	const main = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	const source = await createVersion({
		lix,
		from: main,
		name: "cp_source_test",
	});

	const cp = await createChangeProposal({ lix, source, target: main });

	// Basic shape
	expect(typeof cp.id).toBe("string");
	expect(cp.id.length).toBeGreaterThan(0);
	expect(cp.source_version_id).toBe(source.id);
	expect(cp.target_version_id).toBe(main.id);
	expect(cp.status).toBe("open");

	// Lives in global scope
	const rowAll = await lix.db
		.selectFrom("change_proposal_all")
		.where("id", "=", cp.id)
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(rowAll.lixcol_version_id).toBe("global");

	// Also visible via scoped view
	const row = await lix.db
		.selectFrom("change_proposal")
		.where("id", "=", cp.id)
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(row.status).toBe("open");
});

test("createChangeProposal respects explicit id and status overrides", async () => {
	const lix = await openLix({});

	const main = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	const source = await createVersion({
		lix,
		from: main,
		name: "cp_source_override",
	});

	const customId = "cp_custom_id_123";
	const cp = await createChangeProposal({
		lix,
		id: customId,
		source,
		target: main,
		status: "rejected",
	});

	expect(cp.id).toBe(customId);
	expect(cp.status).toBe("rejected");

	const fetched = await lix.db
		.selectFrom("change_proposal")
		.where("id", "=", customId)
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(fetched.status).toBe("rejected");
});
