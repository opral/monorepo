import {
	createEntityViewsIfNotExists,
	type Lix,
} from "@lix-js/sdk";
import type { Kysely } from "kysely";
import type { InlangDatabaseSchema } from "../database/schema.js";
import { humanId } from "../human-id/human-id.js";
import { v7 as uuidv7 } from "uuid";
import {
	InlangBundleSchema,
	InlangMessageSchema,
	InlangVariantSchema,
} from "../schema-definitions/index.js";

const SCHEMA_APPLIED = new WeakSet<Lix>();

const INLANG_PLUGIN_KEY = "inlang_sdk";
const INLANG_FILE_ID = "inlang";

export function ensureInlangLixSchema(args: { lix: Lix }): void {
	if (SCHEMA_APPLIED.has(args.lix)) {
		return;
	}

	const engine = args.lix.engine as { sqlite: unknown } | undefined;
	if (!engine) {
		throw new Error(
			"Cannot apply Inlang schema: Lix engine is not available in this environment."
		);
	}

	applySchema({ engine });
	SCHEMA_APPLIED.add(args.lix);
}

function applySchema(args: { engine: { sqlite: unknown } }): void {
	createEntityViewsIfNotExists({
		engine: args.engine as any,
		schema: InlangBundleSchema,
		overrideName: "bundle",
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
		defaultValues: {
			id: () => humanId(),
		},
	});

	createEntityViewsIfNotExists({
		engine: args.engine as any,
		schema: InlangMessageSchema,
		overrideName: "message",
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
		defaultValues: {
			id: () => uuidv7(),
		},
	});

	createEntityViewsIfNotExists({
		engine: args.engine as any,
		schema: InlangVariantSchema,
		overrideName: "variant",
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
		defaultValues: {
			id: () => uuidv7(),
		},
	});
}

export async function syncLegacyInlangTablesToLix(args: {
	legacyDb: Kysely<InlangDatabaseSchema>;
	lixDb: Kysely<any>;
}): Promise<void> {
	const [bundles, messages, variants] = await Promise.all([
		args.legacyDb.selectFrom("bundle").selectAll().execute(),
		args.legacyDb.selectFrom("message").selectAll().execute(),
		args.legacyDb.selectFrom("variant").selectAll().execute(),
	]);

	const normalizedBundles = bundles.map((bundle) => ({
		...bundle,
		declarations: JSON.stringify(bundle.declarations ?? []),
	}));

	const normalizedMessages = messages.map((message) => ({
		...message,
		selectors: JSON.stringify(message.selectors ?? []),
	}));

	const normalizedVariants = variants.map((variant) => ({
		...variant,
		matches: JSON.stringify(variant.matches ?? []),
		pattern: JSON.stringify(variant.pattern ?? []),
	}));

	await args.lixDb.transaction().execute(async (trx) => {
		await trx.deleteFrom("variant").execute();
		await trx.deleteFrom("message").execute();
		await trx.deleteFrom("bundle").execute();

		if (normalizedBundles.length > 0) {
			await trx.insertInto("bundle").values(normalizedBundles).execute();
		}
		if (normalizedMessages.length > 0) {
			await trx.insertInto("message").values(normalizedMessages).execute();
		}
		if (normalizedVariants.length > 0) {
			await trx.insertInto("variant").values(normalizedVariants).execute();
		}
	});
}
