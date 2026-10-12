import type { Kysely } from "kysely";
import {
	PluginDoesNotImplementFunctionError,
	PluginMissingError,
} from "../plugin/errors.js";
import type { ProjectSettings } from "../json-schema/settings.js";
import type {
	InlangDatabaseSchema,
	NewBundleRow,
	NewMessageRow,
	NewVariantRow,
} from "../database/schema.js";
import {
	messageFromPlugin,
	variantFromPlugin,
	type ImportedVariant,
} from "./pluginRows.js";
import type { InlangPlugin } from "../plugin/schema.js";
import type { ImportFile } from "../project/api.js";
import { v7 } from "uuid";

const messageReferenceKey = (bundleId: string, locale: string) =>
	JSON.stringify([bundleId, locale]);

const variantReferenceKey = (
	bundleId: string,
	locale: string,
	matches: unknown
) => JSON.stringify([bundleId, locale, matches]);

const INSERT_BATCH_SIZE = 500;

/**
 * Upper bound on message and variant rows written by one commit of a fresh
 * project import. Lix validates and indexes every staged row when the
 * transaction commits, and its worker treats a commit that runs past its
 * operation deadline as lost. Projects with hundreds of thousands of
 * translations therefore commit in bundle-aligned groups below this size;
 * smaller projects still import in a single transaction.
 */
export const IMPORT_ROWS_PER_COMMIT = 100_000;

type FreshImportCommit = {
	bundles: NewBundleRow[];
	messages: (NewMessageRow & { id: string })[];
	variants: NewVariantRow[];
};

/**
 * Splits a fresh import into groups of whole bundles, so every group
 * satisfies its own foreign keys (variants → messages → bundles).
 */
function groupFreshImportCommits(
	bundles: readonly NewBundleRow[],
	messages: readonly (NewMessageRow & { id: string })[],
	variants: readonly NewVariantRow[],
	rowsPerCommit: number
): FreshImportCommit[] {
	const messagesByBundle = new Map<
		string,
		(NewMessageRow & { id: string })[]
	>();
	for (const message of messages) {
		const list = messagesByBundle.get(message.bundle_id);
		if (list) list.push(message);
		else messagesByBundle.set(message.bundle_id, [message]);
	}
	const variantsByMessage = new Map<string, NewVariantRow[]>();
	for (const variant of variants) {
		const list = variantsByMessage.get(variant.message_id);
		if (list) list.push(variant);
		else variantsByMessage.set(variant.message_id, [variant]);
	}
	const commits: FreshImportCommit[] = [];
	let current: FreshImportCommit = { bundles: [], messages: [], variants: [] };
	for (const bundle of bundles) {
		const bundleMessages = messagesByBundle.get(bundle.id!) ?? [];
		const bundleVariants = bundleMessages.flatMap(
			(message) => variantsByMessage.get(message.id) ?? []
		);
		const rows = bundleMessages.length + bundleVariants.length;
		if (
			current.bundles.length > 0 &&
			current.messages.length + current.variants.length + rows > rowsPerCommit
		) {
			commits.push(current);
			current = { bundles: [], messages: [], variants: [] };
		}
		current.bundles.push(bundle);
		current.messages.push(...bundleMessages);
		current.variants.push(...bundleVariants);
	}
	commits.push(current);
	return commits;
}

/**
 * Writes one commit group with multi-row INSERTs inside its transaction.
 * This is faster here than Lix `executeMany` (one statement per row): for
 * 40k variants with their messages and bundles, 2.8 s against 3.6 s through
 * `tx.executeMany` and 7.8 s through auto-commit `executeMany`.
 */
async function insertFreshImportCommit(
	trx: Kysely<InlangDatabaseSchema>,
	commit: FreshImportCommit
) {
	await insertInBatchesByShape({
		rows: commit.bundles,
		optionalColumns: ["declarations"],
		insert: async (rows) => {
			await trx.insertInto("inlang_bundle").values(rows).execute();
		},
	});
	await insertInBatchesByShape({
		rows: commit.messages,
		optionalColumns: ["selectors"],
		insert: async (rows) => {
			await trx.insertInto("inlang_message").values(rows).execute();
		},
	});
	await insertInBatchesByShape({
		rows: commit.variants,
		optionalColumns: ["matches", "pattern"],
		insert: async (rows) => {
			await trx.insertInto("inlang_variant").values(rows).execute();
		},
	});
}

/**
 * Kysely uses one column list for every row in a multi-row insert. Keep rows
 * with different optional-column shapes in separate statements so omitted
 * columns receive their schema defaults.
 */
async function insertInBatchesByShape<T extends object>(args: {
	rows: readonly T[];
	optionalColumns: readonly string[];
	insert: (rows: T[]) => Promise<void>;
}) {
	const rowsByShape = new Map<string, T[]>();
	for (const row of args.rows) {
		const shape = args.optionalColumns
			.map((column) =>
				(row as Record<string, unknown>)[column] === undefined ? "0" : "1"
			)
			.join("");
		const rowsForShape = rowsByShape.get(shape);
		if (rowsForShape) {
			rowsForShape.push(row);
		} else {
			rowsByShape.set(shape, [row]);
		}
	}

	for (const rowsForShape of rowsByShape.values()) {
		for (
			let offset = 0;
			offset < rowsForShape.length;
			offset += INSERT_BATCH_SIZE
		) {
			await args.insert(rowsForShape.slice(offset, offset + INSERT_BATCH_SIZE));
		}
	}
}

export async function importFiles(args: {
	files: ImportFile[];
	readonly pluginKey: string;
	readonly settings: ProjectSettings;
	readonly plugins: readonly InlangPlugin[];
	readonly db: Kysely<InlangDatabaseSchema>;
	/** Testing hook; defaults to {@link IMPORT_ROWS_PER_COMMIT}. */
	readonly rowsPerCommit?: number;
}) {
	const plugin = args.plugins.find((p) => p.key === args.pluginKey);

	if (!plugin) throw new PluginMissingError({ plugin: args.pluginKey });

	if (!plugin.importFiles) {
		throw new PluginDoesNotImplementFunctionError({
			plugin: args.pluginKey,
			function: "importFiles",
		});
	}

	const pluginResult = await plugin.importFiles({
		files: args.files,
		settings: structuredClone(args.settings),
	});
	const imported = {
		bundles: pluginResult.bundles,
		messages: pluginResult.messages.map(messageFromPlugin),
		variants: pluginResult.variants.map(variantFromPlugin),
	};

	// Groups of a large fresh import that commit after the first one.
	let remainingFreshCommits: FreshImportCommit[] = [];
	await args.db.transaction().execute(async (trx) => {
		const hasExistingBundles = await trx
			.selectFrom("inlang_bundle")
			.select("id")
			.limit(1)
			.executeTakeFirst();
		const bundleIds = new Set<string>();
		let bundlesHaveUniqueIds = true;
		for (const bundle of imported.bundles) {
			if (bundle.id === undefined || bundleIds.has(bundle.id)) {
				bundlesHaveUniqueIds = false;
				break;
			}
			bundleIds.add(bundle.id);
		}
		const messageKeys = new Set<string>();
		let messagesHaveUniqueKeys = true;
		for (const message of imported.messages) {
			const key = messageReferenceKey(message.bundle_id, message.locale);
			if (messageKeys.has(key)) {
				messagesHaveUniqueKeys = false;
				break;
			}
			messageKeys.add(key);
		}
		const variantKeys = new Set<string>();
		let variantsHaveUniqueKeys = true;
		for (const variant of imported.variants) {
			if (
				variant.messageBundleId === undefined ||
				variant.messageLocale === undefined
			) {
				variantsHaveUniqueKeys = false;
				break;
			}
			const key = variantReferenceKey(
				variant.messageBundleId,
				variant.messageLocale,
				variant.matches
			);
			if (variantKeys.has(key)) {
				variantsHaveUniqueKeys = false;
				break;
			}
			variantKeys.add(key);
		}
		const canBatchImportFreshProject =
			hasExistingBundles === undefined &&
			bundlesHaveUniqueIds &&
			messagesHaveUniqueKeys &&
			variantsHaveUniqueKeys &&
			imported.messages.every((message) => message.id === undefined) &&
			imported.variants.every(
				(variant) =>
					variant.id === undefined &&
					variant.message_id === undefined &&
					variant.messageBundleId !== undefined &&
					variant.messageLocale !== undefined
			) &&
			imported.messages.every((message) => bundleIds.has(message.bundle_id)) &&
			imported.variants.every((variant) =>
				messageKeys.has(
					messageReferenceKey(variant.messageBundleId!, variant.messageLocale!)
				)
			);

		if (canBatchImportFreshProject) {
			const messagesWithIds = imported.messages.map((message) => ({
				...message,
				id: v7(),
			}));

			const messageIds = new Map(
				messagesWithIds.map((message) => [
					messageReferenceKey(message.bundle_id, message.locale),
					message.id,
				])
			);
			const variantsWithMessageIds: NewVariantRow[] = imported.variants.map(
				(variant) => {
					const messageId = messageIds.get(
						messageReferenceKey(
							variant.messageBundleId!,
							variant.messageLocale!
						)
					);
					if (messageId === undefined) {
						throw new Error("Imported variant does not reference a message");
					}
					return {
						message_id: messageId,
						matches: variant.matches,
						pattern: variant.pattern,
					};
				}
			);
			const [first, ...rest] = groupFreshImportCommits(
				imported.bundles,
				messagesWithIds,
				variantsWithMessageIds,
				args.rowsPerCommit ?? IMPORT_ROWS_PER_COMMIT
			);
			await insertFreshImportCommit(trx, first!);
			remainingFreshCommits = rest;
			return;
		}

		// upsert every bundle
		for (const bundle of imported.bundles) {
			await trx
				.insertInto("inlang_bundle")
				.values(bundle)
				.onConflict((oc) => oc.column("id").doUpdateSet(bundle))
				.execute();
		}
		// upsert every message
		for (const message of imported.messages) {
			// match the message by bundle id and locale if
			// no id is provided by the importer
			if (message.id === undefined) {
				const exisingMessage = await trx
					.selectFrom("inlang_message")
					.where("bundle_id", "=", message.bundle_id)
					.where("locale", "=", message.locale)
					.select("id")
					.executeTakeFirst();
				message.id = exisingMessage?.id;
			}
			const referencedBundle = await trx
				.selectFrom("inlang_bundle")
				.select("id")
				.where("id", "=", message.bundle_id)
				.executeTakeFirst();
			if (!referencedBundle) {
				await trx
					.insertInto("inlang_bundle")
					.values({ id: message.bundle_id })
					.execute();
			}
			await trx
				.insertInto("inlang_message")
				.values(message)
				.onConflict((oc) => oc.column("id").doUpdateSet(message))
				.execute();
		}
		// upsert every variant
		for (const variant of imported.variants) {
			// match the variant by message id and matches if
			// no id is provided by the importer
			if (variant.id === undefined) {
				let existingMessage = await trx
					.selectFrom("inlang_message")
					.where("bundle_id", "=", variant.messageBundleId)
					.where("locale", "=", variant.messageLocale)
					.select("id")
					.executeTakeFirst();

				// if the message does not exist, create it
				if (existingMessage === undefined) {
					const existingBundle = await trx
						.selectFrom("inlang_bundle")
						.where("id", "=", variant.messageBundleId)
						.select("id")
						.executeTakeFirst();
					// if the bundle does not exist, create it
					if (existingBundle === undefined) {
						await trx
							.insertInto("inlang_bundle")
							.values({ id: variant.messageBundleId })
							.execute();
					}
					// insert the message
					existingMessage = await trx
						.insertInto("inlang_message")
						.values({
							bundle_id: variant.messageBundleId,
							locale: variant.messageLocale,
						})
						.returningAll()
						.executeTakeFirstOrThrow();
				}

				const existingVariants = await trx
					.selectFrom("inlang_variant")
					.where("message_id", "=", existingMessage.id)
					.selectAll()
					.execute();

				const existingVariant = existingVariants.find(
					(v) => JSON.stringify(v.matches) === JSON.stringify(variant.matches)
				);

				// need to reset typescript's type narrowing
				(variant as ImportedVariant).id = existingVariant?.id;
				(variant as ImportedVariant).message_id = existingMessage.id;
			}
			const toBeInsertedVariant: NewVariantRow = {
				...variant,
				// @ts-expect-error - bundle id is provided by VariantImport but not needed when inserting
				messageBundleId: undefined,
				messageLocale: undefined,
			};
			await trx
				.insertInto("inlang_variant")
				.values(toBeInsertedVariant)
				.onConflict((oc) => oc.column("id").doUpdateSet(toBeInsertedVariant))
				.execute();
		}
	});
	for (const commit of remainingFreshCommits) {
		await args.db
			.transaction()
			.execute((trx) => insertFreshImportCommit(trx, commit));
	}
}
