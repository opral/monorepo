import { v4 } from "uuid";
import { afterEach, beforeEach, bench, describe } from "vitest";
import {
	getLeafChange,
	newLixFile,
	openLixInMemory,
	type Change,
} from "../index.js";
import { getLeafChangeRecursive } from "../query-utilities/get-leaf-change.js";
import { sql, type RawBuilder } from "kysely";
import fs from 'fs'

function json<T> (object: T): RawBuilder<T> {
	return sql`jsonb(${JSON.stringify(object)})`
  }

const createChange = (parentChangeId?: string) => {
	
	const change: Change = {
		id: v4(),
		parent_id: parentChangeId,
		operation: "create",
		file_id: "mock",
		plugin_key: parentChangeId ? "mock" : "mock1",
		type: "mock",
		// @ts-expect-error - type error in lix
		value: JSON.stringify(samplePaylod),
		valueB: json(samplePaylod) as any,
		commit_id: 'abuse_for_column_in_overflow'
	};
	return change;
};

const setupLix = async (nChanges: number) => {
	console.log('setting up lix for ' + nChanges + ' changes' )
	const lix = await openLixInMemory({
		blob: await newLixFile(),
	});

	await sql`PRAGMA page_size = 16384;`.execute(lix.db)
	
	const mockChanges: Change[] = [];
	let lastChangeId: undefined | string = undefined;
	let firstChangeId: undefined | string = undefined;
	for (let i = 0; i < nChanges; i++) {
		const change = createChange(lastChangeId);
		lastChangeId = change.id;
		if (!firstChangeId) {
			firstChangeId = change.id;
		}
		mockChanges.push(change);
	}

	const batchSize = 1;
	// Insert changes in batches
	for (let i = 0; i < mockChanges.length; i += batchSize) {
		const batch = mockChanges.slice(i, i + batchSize);
		
		// console.log(lix.db.insertInto("change").values(batch).compile())
		await lix.db.insertInto("change").values(batch).executeTakeFirst();
	}
	// await lix.db.insertInto("change").values(mockChanges).executeTakeFirst();
	console.log('setting up lix for ' + nChanges + ' changes.... done' )


	const dbContent = await lix.toBlob()
	const ab = await dbContent.arrayBuffer()
	const buffer =  Buffer.from(ab)

	fs.writeFile('output.db', buffer, (err) => {
        if (err) throw err;
        console.log('Blob has been written to output.txt');
    });

	return { lix, firstChangeId };
};

async function wait(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, ms); // 1000 milliseconds = 1 second
	});
}

for (let i = 0; i < 5; i++) {
	const nChanges = Math.pow(10, i);
	describe(
		"select changes via JSON / JSONB / COLUMN (last and first) " +
			nChanges +
			" changes",
		async () => {
			let project = await setupLix(nChanges);

			bench("JSON payload-> first property", async () => {
				let result = await project.lix.db
					.selectFrom("change")
					.selectAll()
					.where(
						(eb) => eb.ref("value", "->>").key("a"),
						"=",
						"mock1",
					)

					.executeTakeFirst();

				// console.log(result)

				// console.log(result)
			});

			

			bench("JSON payload-> last property", async () => {
				let result = await project.lix.db
					.selectFrom("change")
					.selectAll()
					.where(
						(eb) => eb.ref("value", "->>").key("n"),
						"=",
						"mock1",
					)

					.executeTakeFirst();

				// console.log(result)
			});


			bench("JSONB payload->first property", async () => {
				let result = await project.lix.db
					.selectFrom("change")
					.selectAll()
					.where(
						(eb) => eb.ref("valueB", "->>").key("a"),
						"=",
						"mock1",
					)

					.executeTakeFirst();

				// console.log(result)
			});
			
			bench("JSONB payload-> last property", async () => {
				let result = await project.lix.db
					.selectFrom("change")
					.selectAll()
					.where(
						(eb) => eb.ref("valueB", "->>").key("n"),
						"=",
						"mock1",
					)

					.executeTakeFirst();

				// console.log(result)
			});

			bench("column", async () => {
				let result = await project.lix.db
					.selectFrom("change")
					.selectAll()
					.where("plugin_key", "=", "mock1")

					.executeTakeFirst();

				// console.log(result)
			});

			bench("column in overflow", async () => {
				let result = await project.lix.db
					.selectFrom("change")
					.selectAll()
					.where("commit_id", "=", "abuse_for_column_in_overflow")

					.executeTakeFirst();

				// console.log(result)
			});

			
		} 
	);
}

const samplePaylod = {
	"z": "1",
	"a": "mock1",
	"b": "1",
	"c": "1",
	"d": "1",
	"e": "1",
	"f": "1",
	"g": "1abcdefghijklmnopqrstuvwxyz 2abcdefghijklmnopqrstuvwxyz 3abcdefghijklmnopqrstuvwxyz 4abcdefghijklmnopqrstuvwxyz 5abcdefghijklmnopqrstuvwxyz 6abcdefghijklmnopqrstuvwxyz 7abcdefghijklmnopqrstuvwxyz 8abcdefghijklmnopqrstuvwxyz 9abcdefghijklmnopqrstuvwxyz 10abcdefghijklmnopqrstuvwxyz 11abcdefghijklmnopqrstuvwxyz 12abcdefghijklmnopqrstuvwxyz 13abcdefghijklmnopqrstuvwxyz 14abcdefghijklmnopqrstuvwxyz 15abcdefghijklmnopqrstuvwxyz 16abcdefghijklmnopqrstuvwxyz 17abcdefghijklmnopqrstuvwxyz 18abcdefghijklmnopqrstuvwxyz 19abcdefghijklmnopqrstuvwxyz 20abcdefghijklmnopqrstuvwxyz 21abcdefghijklmnopqrstuvwxyz 22abcdefghijklmnopqrstuvwxyz 23abcdefghijklmnopqrstuvwxyz 24abcdefghijklmnopqrstuvwxyz 25abcdefghijklmnopqrstuvwxyz 26abcdefghijklmnopqrstuvwxyz 27abcdefghijklmnopqrstuvwxyz 28abcdefghijklmnopqrstuvwxyz 29abcdefghijklmnopqrstuvwxyz 30abcdefghijklmnopqrstuvwxyz 31abcdefghijklmnopqrstuvwxyz 32abcdefghijklmnopqrstuvwxyz 33abcdefghijklmnopqrstuvwxyz 34abcdefghijklmnopqrstuvwxyz 35abcdefghijklmnopqrstuvwxyz 36abcdefghijklmnopqrstuvwxyz 37abcdefghijklmnopqrstuvwxyz 38abcdefghijklmnopqrstuvwxyz 39abcdefghijklmnopqrstuvwxyz 40abcdefghijklmnopqrstuvwxyz 41abcdefghijklmnopqrstuvwxyz 42abcdefghijklmnopqrstuvwxyz 43abcdefghijklmnopqrstuvwxyz 44abcdefghijklmnopqrstuvwxyz 45abcdefghijklmnopqrstuvwxyz 46abcdefghijklmnopqrstuvwxyz 47abcdefghijklmnopqrstuvwxyz 48abcdefghijklmnopqrstuvwxyz 49abcdefghijklmnopqrstuvwxyz 50abcdefghijklmnopqrstuvwxyz 51abcdefghijklmnopqrstuvwxyz 52abcdefghijklmnopqrstuvwxyz 53abcdefghijklmnopqrstuvwxyz 54abcdefghijklmnopqrstuvwxyz 55abcdefghijklmnopqrstuvwxyz 56abcdefghijklmnopqrstuvwxyz 57abcdefghijklmnopqrstuvwxyz 58abcdefghijklmnopqrstuvwxyz 59abcdefghijklmnopqrstuvwxyz 60abcdefghijklmnopqrstuvwxyz 61abcdefghijklmnopqrstuvwxyz 62abcdefghijklmnopqrstuvwxyz abcdefghijklmnopqrstuvwxyz 63 abcdefghijklmnopqrstuvwxyz -------------------- 1abcdefghijklmnopqrstuvwxyz 2abcdefghijklmnopqrstuvwxyz 3abcdefghijklmnopqrstuvwxyz 4abcdefghijklmnopqrstuvwxyz 5abcdefghijklmnopqrstuvwxyz 6abcdefghijklmnopqrstuvwxyz 7abcdefghijklmnopqrstuvwxyz 8abcdefghijklmnopqrstuvwxyz 9abcdefghijklmnopqrstuvwxyz 10abcdefghijklmnopqrstuvwxyz 11abcdefghijklmnopqrstuvwxyz 12abcdefghijklmnopqrstuvwxyz 13abcdefghijklmnopqrstuvwxyz 14abcdefghijklmnopqrstuvwxyz 15abcdefghijklmnopqrstuvwxyz 16abcdefghijklmnopqrstuvwxyz 17abcdefghijklmnopqrstuvwxyz 18abcdefghijklmnopqrstuvwxyz 19abcdefghijklmnopqrstuvwxyz 20abcdefghijklmnopqrstuvwxyz 21abcdefghijklmnopqrstuvwxyz 22abcdefghijklmnopqrstuvwxyz 23abcdefghijklmnopqrstuvwxyz 24abcdefghijklmnopqrstuvwxyz 25abcdefghijklmnopqrstuvwxyz 26abcdefghijklmnopqrstuvwxyz 27abcdefghijklmnopqrstuvwxyz 28abcdefghijklmnopqrstuvwxyz 29abcdefghijklmnopqrstuvwxyz 30abcdefghijklmnopqrstuvwxyz 31abcdefghijklmnopqrstuvwxyz 32abcdefghijklmnopqrstuvwxyz 0123456789a0123456789a0123456789a",
	"h": "I AM STILL THE SAME",
	"i": "0123456789a0123456789a0123456789a",
	"j": "0123456789a0123456789a0123456789a",
	"k": "0123456789a0123456789a0123456789a",
	"l": "0123456789a0123456789a0123456789a",
	"m": "1abcdefghijklmnopqrstuvwxyz 2abcdefghijklmnopqrstuvwxyz 3abcdefghijklmnopqrstuvwxyz 4abcdefghijklmnopqrstuvwxyz 5abcdefghijklmnopqrstuvwxyz 6abcdefghijklmnopqrstuvwxyz 7abcdefghijklmnopqrstuvwxyz 8abcdefghijklmnopqrstuvwxyz 9abcdefghijklmnopqrstuvwxyz 10abcdefghijklmnopqrstuvwxyz 11abcdefghijklmnopqrstuvwxyz 12abcdefghijklmnopqrstuvwxyz 13abcdefghijklmnopqrstuvwxyz 14abcdefghijklmnopqrstuvwxyz 15abcdefghijklmnopqrstuvwxyz 16abcdefghijklmnopqrstuvwxyz 17abcdefghijklmnopqrstuvwxyz1abcdefghijklmnopqrstuvwxyz 2abcdefghijklmnopqrstuvwxyz 3abcdefghijklmnopqrstuvwxyz 4abcdefghijklmnopqrstuvwxyz 5abcdefghijklmnopqrstuvwxyz 6abcdefghijklmnopqrstuvwxyz 7abcdefghijklmnopqrstuvwxyz 8abcdefghijklmnopqrstuvwxyz 9abcdefghijklmnopqrstuvwxyz 10abcdefghijklmnopqrstuvwxyz 11abcdefghijklmnopqrstuvwxyz 12abcdefghijklmnopqrstuvwxyz 13abcdefghijklmnopqrstuvwxyz 14abcdefghijklmnopqrstuvwxyz 15abcdefghijklmnopqrstuvwxyz 16abcdefghijklmnopqrstuvwxyz 17abcdefghijklmnopqrstuvwxyz1abcdefghijklmnopqrstuvwxyz 2abcdefghijklmnopqrstuvwxyz 3abcdefghijklmnopqrstuvwxyz 4abcdefghijklmnopqrstuvwxyz 5abcdefghijklmnopqrstuvwxyz 6abcdefghijklmnopqrstuvwxyz 7abcdefghijklmnopqrstuvwxyz 8abcdefghijklmnopqrstuvwxyz 9abcdefghijklmnopqrstuvwxyz 10abcdefghijklmnopqrstuvwxyz 11abcdefghijklmnopqrstuvwxyz 12abcdefghijklmnopqrstuvwxyz 13abcdefghijklmnopqrstuvwxyz 14abcdefghijklmnopqrstuvwxyz 15abcdefghijklmnopqrstuvwxyz 16abcdefghijklmnopqrstuvwxyz 17abcdefghijklmnopqrstuvwxyz1abcdefghijklmnopqrstuvwxyz 2abcdefghijklmnopqrstuvwxyz 3abcdefghijklmnopqrstuvwxyz 4abcdefghijklmnopqrstuvwxyz 5abcdefghijklmnopqrstuvwxyz 6abcdefghijklmnopqrstuvwxyz 7abcdefghijklmnopqrstuvwxyz 8abcdefghijklmnopqrstuvwxyz 9abcdefghijklmnopqrstuvwxyz 10abcdefghijklmnopqrstuvwxyz 11abcdefghijklmnopqrstuvwxyz 12abcdefghijklmnopqrstuvwxyz 13abcdefghijklmnopqrstuvwxyz 14abcdefghijklmnopqrstuvwxyz 15abcdefghijklmnopqrstuvwxyz 16abcdefghijklmnopqrstuvwxyz 17abcdefghijklmnopqrstuvwxyz1abcdefghijklmnopqrstuvwxyz 2abcdefghijklmnopqrstuvwxyz 3abcdefghijklmnopqrstuvwxyz 4abcdefghijklmnopqrstuvwxyz 5abcdefghijklmnopqrstuvwxyz 6abcdefghijklmnopqrstuvwxyz 7abcdefghijklmnopqrstuvwxyz 8abcdefghijklmnopqrstuvwxyz 9abcdefghijklmnopqrstuvwxyz 10abcdefghijklmnopqrstuvwxyz 11abcdefghijklmnopqrstuvwxyz 12abcdefghijklmnopqrstuvwxyz 13abcdefghijklmnopqrstuvwxyz 14abcdefghijklmnopqrstuvwxyz 15abcdefghijklmnopqrstuvwxyz 16abcdefghijklmnopqrstuvwxyz 17abcdefghijklmnopqrstuvwxyz ",
	"n": "mock1",
}

