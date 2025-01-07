import { Kysely } from "kysely";
import {
	contentFromDatabase,
	createDialect,
	createInMemoryDatabase,
	loadDatabaseInMemory,
} from "sqlite-wasm-kysely";
import { expect, test } from "vitest";
import {
	applyAccountDatabaseSchema,
	type AccountTable,
	type ActiveAccountTable,
} from "./database-schema.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

type AccountSchema = {
	account: AccountTable;
	active_account: ActiveAccountTable;
};

test("account table should have no entry but an active account", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	// the database has the propert definition for the uuid_v7 function
	sqlite.createFunction("uuid_v7", {
		arity: 0,
		deterministic: true,
		xFunc: () => "mock_uuid_v7",
	});

	applyAccountDatabaseSchema(sqlite);

	const db = new Kysely<AccountSchema>({
		dialect: createDialect({
			database: sqlite,
		}),
	});

	const account = await db.selectFrom("account").selectAll().execute();

	expect(account?.length).toBe(0);

	const active_account = await db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirst();

	expect(active_account?.id).toBe("mock_uuid_v7");
});

test("account.id should default to uuid_v7", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	// the database has the propert definition for the uuid_v7 function
	sqlite.createFunction("uuid_v7", {
		arity: 0,
		deterministic: true,
		xFunc: () => "mock_uuid_v7",
	});

	applyAccountDatabaseSchema(sqlite);

	const db = new Kysely<AccountSchema>({
		dialect: createDialect({
			database: sqlite,
		}),
	});

	const result = await db
		.insertInto("account")
		.values({
			name: "test",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(result.id).toBe("mock_uuid_v7");
});

test('it should drop the temp "current_account" table on reboot to not persist the current account', async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	// the database has the propert definition for the uuid_v7 function
	sqlite.createFunction("uuid_v7", {
		arity: 0,
		deterministic: true,
		xFunc: () => "mock_uuid_v7",
	});

	applyAccountDatabaseSchema(sqlite);

	const db = new Kysely<AccountSchema>({
		dialect: createDialect({
			database: sqlite,
		}),
	});

	await db
		.insertInto("account")
		.values({
			id: "test",
			name: "test",
		})
		.execute();

	await db.deleteFrom("active_account").execute();

	await db
		.insertInto("active_account")
		.values({
			id: "test",
			name: "test",
		})
		.execute();

	const currentAccount = await db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirst();

	expect(currentAccount).toMatchObject({
		id: "test",
	});

	const blob = contentFromDatabase(sqlite) as unknown as ArrayBuffer;

	// re-open the database

	const sqlite2 = await loadDatabaseInMemory(blob);

	// the database has the propert definition for the uuid_v7 function
	sqlite2.createFunction("uuid_v7", {
		arity: 0,
		deterministic: true,
		xFunc: () => "mock_uuid_v7-2",
	});

	applyAccountDatabaseSchema(sqlite2);

	const db2 = new Kysely<AccountSchema>({
		dialect: createDialect({
			database: sqlite2,
		}),
	});

	const account2 = await db2
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirst();

	expect(account2).toMatchObject({
		id: "mock_uuid_v7-2",
	});
});

test("should generate different anonymous account names", async () => {
	const lix0 = await openLixInMemory({});
	const lix1 = await openLixInMemory({});
	const lix2 = await openLixInMemory({});

	const account0 = await lix0.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirst();

	const account1 = await lix1.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirst();

	const account2 = await lix2.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirst();

	expect(account0?.name).not.toBe(account1?.name);
	expect(account1?.name).not.toBe(account2?.name);
});
