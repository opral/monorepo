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
	type CurrentAccountTable,
} from "./database-schema.js";

type AccountSchema = {
	account: AccountTable;
	current_account: CurrentAccountTable;
};

test("account table should have a default anonymous account", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	applyAccountDatabaseSchema(sqlite);

	const db = new Kysely<AccountSchema>({
		dialect: createDialect({
			database: sqlite,
		}),
	});

	const account = await db
		.selectFrom("account")
		.selectAll()
		.where("id", "=", "anonymous")
		.executeTakeFirst();

	expect(account).toMatchObject({
		id: "anonymous",
		name: "anonymous",
	});
});

test("current_account table should be empty on startup", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	applyAccountDatabaseSchema(sqlite);

	const db = new Kysely<AccountSchema>({
		dialect: createDialect({
			database: sqlite,
		}),
	});

	const account = await db
		.selectFrom("current_account")
		.selectAll()
		.executeTakeFirst();

	expect(account).toBeUndefined();
});

test("current_account table should be able to be set", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
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

	await db
		.insertInto("current_account")
		.values({
			id: "test",
		})
		.execute();

	const account = await db
		.selectFrom("current_account")
		.selectAll()
		.executeTakeFirst();

	expect(account).toMatchObject({
		id: "test",
	});
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

	await db
		.insertInto("current_account")
		.values({
			id: "test",
		})
		.execute();

	const currentAccount = await db
		.selectFrom("current_account")
		.selectAll()
		.executeTakeFirst();

	expect(currentAccount).toMatchObject({
		id: "test",
	});

	const blob = contentFromDatabase(sqlite);

	// re-open the database

	const sqlite2 = await loadDatabaseInMemory(blob);

	applyAccountDatabaseSchema(sqlite2);

	const db2 = new Kysely<AccountSchema>({
		dialect: createDialect({
			database: sqlite2,
		}),
	});

	const account2 = await db2
		.selectFrom("current_account")
		.selectAll()
		.executeTakeFirst();

	expect(account2).toBeUndefined();
});
