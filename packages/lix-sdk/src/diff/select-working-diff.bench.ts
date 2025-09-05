import { bench } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createCheckpoint } from "../state/create-checkpoint.js";
import { selectWorkingDiff } from "./select-working-diff.js";
import { LixKeyValueSchema } from "../key-value/schema.js";
import { sql } from "kysely";

const FILE_ID = "lix"; // key_value is stored under hardcoded file_id 'lix'
const KV_SCHEMA = LixKeyValueSchema["x-lix-key"];
const ROWS = 10; // created working rows (small)
const BASE_UNCHANGED = 10; // baseline unchanged rows (moderate)

async function setKeyValue(lix: any, key: string, value: any) {
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


bench("working diff: include unchanged", async () => {
  const lix = await openLix({});
  await createCheckpoint({ lix });

  // Seed baseline tracked rows and checkpoint them (become unchanged)
  for (let i = 0; i < BASE_UNCHANGED; i++) {
    await setKeyValue(lix, `base_${i}`, `A${i}`);
  }
  await createCheckpoint({ lix });

  // Add some working edits (created)
  for (let i = 0; i < ROWS; i++) {
    await setKeyValue(lix, `work_${i}`, i);
  }

  // Include unchanged (no status filter). Select minimal column to avoid JSON overhead
  await selectWorkingDiff({ lix })
    .where("file_id", "=", FILE_ID)
    .where("schema_key", "=", KV_SCHEMA)
    .orderBy("entity_id")
    .select(["status"] as any)
    .execute();
});

bench("working diff: exclude unchanged", async () => {
  const lix = await openLix({});
  await createCheckpoint({ lix });

  // Seed baseline tracked rows and checkpoint them (become unchanged)
  for (let i = 0; i < BASE_UNCHANGED; i++) {
    await setKeyValue(lix, `base_${i}`, `A${i}`);
  }
  await createCheckpoint({ lix });

  // Add some working edits (created)
  for (let i = 0; i < ROWS; i++) {
    await setKeyValue(lix, `work_${i}`, i);
  }

  // Exclude unchanged
  await selectWorkingDiff({ lix })
    .where("file_id", "=", FILE_ID)
    .where("schema_key", "=", KV_SCHEMA)
    .where("status", "!=", sql.lit("unchanged"))
    .orderBy("entity_id")
    .select(["status"] as any)
    .execute();
});
