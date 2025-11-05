import { afterAll, beforeAll, beforeEach, bench, describe } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createCheckpoint } from "../state/create-checkpoint.js";
import { selectWorkingDiff } from "./select-working-diff.js";
import { LixKeyValueSchema } from "../key-value/schema-definition.js";

const FILE_ID = "lix";
const KV_SCHEMA = LixKeyValueSchema["x-lix-key"];
const ROWS = 10;
const BASE_UNCHANGED = 10;

type WorkingDiffCtx = Awaited<ReturnType<typeof openLix>>;

async function createWorkingDiffCtx(): Promise<WorkingDiffCtx> {
	return openLix({});
}

async function resetWorkingState(lix: WorkingDiffCtx): Promise<void> {
	await lix.db.deleteFrom("key_value").execute();

	await createCheckpoint({ lix });

	for (let i = 0; i < BASE_UNCHANGED; i++) {
		await setKeyValue(lix, `base_${i}`, `A${i}`);
	}
	await createCheckpoint({ lix });

	for (let i = 0; i < ROWS; i++) {
		await setKeyValue(lix, `work_${i}`, i);
	}
}

async function setKeyValue(lix: WorkingDiffCtx, key: string, value: unknown) {
	const existing = await lix.db
		.selectFrom("key_value")
		.where("key", "=", key)
		.select("key")
		.executeTakeFirst();
	if (existing) {
		await lix.db
			.updateTable("key_value")
			.set({ value })
			.where("key", "=", key)
			.execute();
	} else {
		await lix.db.insertInto("key_value").values({ key, value }).execute();
	}
}

describe("working diff: include unchanged", () => {
	let lix: WorkingDiffCtx;

	beforeAll(async () => {
		lix = await createWorkingDiffCtx();
	});

	afterAll(async () => {
		await lix.close();
	});

	beforeEach(async () => {
		await resetWorkingState(lix);
	});

	bench("working diff: include unchanged", async () => {
		await selectWorkingDiff({ lix })
			.where("file_id", "=", FILE_ID)
			.where("schema_key", "=", KV_SCHEMA)
			.orderBy("entity_id")
			.select(["status"])
			.execute();
	});
});

describe("working diff: exclude unchanged", () => {
	let lix: WorkingDiffCtx;

	beforeAll(async () => {
		lix = await createWorkingDiffCtx();
	});

	afterAll(async () => {
		await lix.close();
	});

	beforeEach(async () => {
		await resetWorkingState(lix);
	});

	bench("working diff: exclude unchanged", async () => {
		await selectWorkingDiff({ lix })
			.where("file_id", "=", FILE_ID)
			.where("schema_key", "=", KV_SCHEMA)
			.where("status", "!=", "unchanged")
			.orderBy("entity_id")
			.select(["status"])
			.execute();
	});
});
