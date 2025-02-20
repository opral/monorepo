import type { DetectedChange, LixPlugin } from "@lix-js/sdk";
import { BundleSchemaV1 } from "./schemas/bundle.js";
import { MessageSchemaV1 } from "./schemas/message.js";
import { initDb } from "../database/initDb.js";
import {
	createInMemoryDatabase,
	loadDatabaseInMemory,
} from "sqlite-wasm-kysely";
import type { Kysely } from "kysely";
import type { InlangDatabaseSchema } from "../database/schema.js";
import { VariantSchemaV1 } from "./schemas/variant.js";

// @ts-expect-error - possibly too recursive inference
export const detectChanges: NonNullable<LixPlugin["detectChanges"]> = async ({
	before,
	after,
}) => {
	if (after === undefined) {
		console.warn("The unique_column metadata is required to detect changes");
		return [];
	}

	const detectedChanges: DetectedChange<
		typeof BundleSchemaV1 | typeof MessageSchemaV1 | typeof VariantSchemaV1
	>[] = [];

	const beforeSqlite = before?.data
		? // @ts-expect-error - data seem to be the wrong type
			await loadDatabaseInMemory(before.data)
		: await createInMemoryDatabase({
				readOnly: false,
			});

	const afterSqlite = before?.data
		? // @ts-expect-error - data seem to be the wrong type
			await loadDatabaseInMemory(after.data)
		: await createInMemoryDatabase({
				readOnly: false,
			});

	const beforeDb = initDb({ sqlite: beforeSqlite });
	const afterDb = initDb({ sqlite: afterSqlite });

	// NOTE: known to be inefficient - but enough for now
	detectedChanges.push(
		...(await diffTable({
			before: beforeDb,
			after: afterDb,
			tableName: "bundle",
		}))
	);

	// NOTE: known to be inefficient - but enough for now
	detectedChanges.push(
		...(await diffTable({
			before: beforeDb,
			after: afterDb,
			tableName: "message",
		}))
	);

	// NOTE: known to be inefficient - but enough for now
	detectedChanges.push(
		...(await diffTable({
			before: beforeDb,
			after: afterDb,
			tableName: "variant",
		}))
	);

	return detectedChanges;
};

const diffTable = async ({
	before,
	after,
	tableName,
	// idColumn,
}: {
	before: Kysely<InlangDatabaseSchema>;
	after: Kysely<InlangDatabaseSchema>;
	tableName: "bundle" | "message" | "variant";
	//  idColumn: string; NOTE all tables use the id column - no need to pass it
}) => {
	const rowsBefore = await after?.selectFrom(tableName).selectAll().execute();
	const rowsAfter = await before?.selectFrom(tableName).selectAll().execute();

	const changes: DetectedChange[] = [];

	const rowsBeforeMap = new Map(rowsBefore.map((row) => [row.id, row]));
	const rowsAfterMap = new Map(rowsAfter.map((row) => [row.id, row]));

	let schemaType;
	if (tableName === "bundle") {
		schemaType = BundleSchemaV1;
	} else if (tableName === "message") {
		schemaType = MessageSchemaV1;
	} else if (tableName === "variant") {
		schemaType = VariantSchemaV1;
	} else {
		throw new Error("Unknown schema type for table " + tableName);
	}

	for (const [id, afterRow] of rowsAfterMap) {
		const beforeRow = rowsBeforeMap.get(id);

		if (!beforeRow) {
			// row was inserted
			changes.push({
				entity_id: id,
				snapshot: afterRow,
				schema: schemaType,
			});
		} else if (JSON.stringify(beforeRow) !== JSON.stringify(afterRow)) {
			// row was updated
			changes.push({
				entity_id: id,
				snapshot: afterRow,
				schema: schemaType,
			});
		}

		rowsBeforeMap.delete(id);
	}

	for (const beforeRow of rowsBeforeMap.values()) {
		// row wass not found in after db -> was deleted
		changes.push({
			entity_id: beforeRow.id,
			snapshot: null,
			schema: schemaType,
		});
	}

	return changes;
};
