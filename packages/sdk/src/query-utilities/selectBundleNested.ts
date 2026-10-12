import { lixOf } from "../database/lixBatch.js";
import { streamCompiledQuery } from "../database/lixDialect.js";
import type { Kysely } from "kysely";
import type {
	BundleNested,
	InlangDatabaseSchema,
	VariantRow,
	MessageNested,
} from "../database/schema.js";

/**
 * Select bundles with nested messages and variants.
 *
 * A single bundle is read with one flat left join. Reading every bundle
 * instead streams the three tables and nests them here: the join repeats each
 * bundle's declarations on every variant row and costs several times the
 * three scans combined, and a buffered read of a large project (hundreds of
 * thousands of variants) exceeds Lix's buffered read cap. The three scans read
 * one Lix snapshot (`lix.read()`), so they see the same state.
 */
export const selectBundleNested = (db: Kysely<InlangDatabaseSchema>) => {
	let bundleId: string | undefined;

	const query = {
		where(column: "inlang_bundle.id", operator: "=", value: string) {
			if (column !== "inlang_bundle.id" || operator !== "=") {
				throw new Error(
					"selectBundleNested only supports inlang_bundle.id equality"
				);
			}
			bundleId = value;
			return query;
		},
		selectAll() {
			return query;
		},
		async execute(): Promise<BundleNested[]> {
			if (bundleId === undefined) {
				return selectAllBundlesNested(db);
			}
			let flatQuery = db
				.selectFrom("inlang_bundle")
				.leftJoin(
					"inlang_message",
					"inlang_message.bundle_id",
					"inlang_bundle.id"
				)
				.leftJoin(
					"inlang_variant",
					"inlang_variant.message_id",
					"inlang_message.id"
				)
				.select([
					"inlang_bundle.id as bundle_id",
					"inlang_bundle.declarations as bundle_declarations",
					"inlang_message.id as message_id",
					"inlang_message.locale as message_locale",
					"inlang_message.selectors as message_selectors",
					"inlang_variant.id as variant_id",
					"inlang_variant.matches as variant_matches",
					"inlang_variant.pattern as variant_pattern",
				])
				.orderBy("inlang_bundle.id")
				.orderBy("inlang_message.id")
				.orderBy("inlang_variant.id");
			flatQuery = flatQuery.where("inlang_bundle.id", "=", bundleId);
			const rows = await flatQuery.execute();
			const bundles = new Map<string, BundleNested>();
			const messages = new Map<string, MessageNested>();

			for (const row of rows) {
				let bundle = bundles.get(row.bundle_id);
				if (!bundle) {
					bundle = {
						id: row.bundle_id,
						declarations: row.bundle_declarations,
						messages: [],
					};
					bundles.set(row.bundle_id, bundle);
				}
				if (row.message_id === null) continue;
				let message = messages.get(row.message_id);
				if (!message) {
					message = {
						id: row.message_id,
						bundle_id: row.bundle_id,
						locale: row.message_locale!,
						selectors: row.message_selectors!,
						variants: [],
					};
					messages.set(row.message_id, message);
					bundle.messages.push(message);
				}
				if (row.variant_id !== null) {
					message.variants.push({
						id: row.variant_id,
						message_id: row.message_id,
						matches: row.variant_matches!,
						pattern: row.variant_pattern!,
					} satisfies VariantRow);
				}
			}
			return [...bundles.values()];
		},
		async executeTakeFirst(): Promise<BundleNested | undefined> {
			return (await query.execute())[0];
		},
		async executeTakeFirstOrThrow(): Promise<BundleNested> {
			const result = await query.executeTakeFirst();
			if (!result) throw new Error("No bundle found");
			return result;
		},
	};

	return query;
};

async function selectAllBundlesNested(
	db: Kysely<InlangDatabaseSchema>
): Promise<BundleNested[]> {
	// Each scan is ordered by id, so nesting below preserves the bundle, message,
	// and variant order of the joined query.
	const bundleQuery = db
		.selectFrom("inlang_bundle")
		.select(["id", "declarations"])
		.orderBy("id");
	const messageQuery = db
		.selectFrom("inlang_message")
		.select(["id", "bundle_id", "locale", "selectors"])
		.orderBy("id");
	const variantQuery = db
		.selectFrom("inlang_variant")
		.select(["id", "message_id", "matches", "pattern"])
		.orderBy("id");
	type Pages<Q extends { execute(): Promise<unknown[]> }> = AsyncIterable<
		Awaited<ReturnType<Q["execute"]>>
	>;
	const nest = async (
		bundlePages: Pages<typeof bundleQuery>,
		messagePages: () => Pages<typeof messageQuery>,
		variantPages: () => Pages<typeof variantQuery>
	): Promise<BundleNested[]> => {
		const bundles = new Map<string, BundleNested>();
		for await (const page of bundlePages) {
			for (const row of page) {
				bundles.set(row.id, {
					id: row.id,
					declarations: row.declarations,
					messages: [],
				});
			}
		}
		const messages = new Map<string, MessageNested>();
		for await (const page of messagePages()) {
			for (const row of page) {
				// Matches the inner side of the left join: a message whose bundle
				// is missing is not reachable from any bundle.
				const bundle = bundles.get(row.bundle_id);
				if (!bundle) continue;
				const message: MessageNested = {
					id: row.id,
					bundle_id: row.bundle_id,
					locale: row.locale,
					selectors: row.selectors,
					variants: [],
				};
				messages.set(row.id, message);
				bundle.messages.push(message);
			}
		}
		for await (const page of variantPages()) {
			for (const row of page) {
				messages.get(row.message_id)?.variants.push({
					id: row.id,
					message_id: row.message_id,
					matches: row.matches,
					pattern: row.pattern,
				} satisfies VariantRow);
			}
		}
		return [...bundles.values()];
	};

	const lix = lixOf(db);
	if (!lix) {
		// A database without an attached Lix streams each table on its own.
		const pages = <R>(rows: AsyncIterable<R>) =>
			(async function* () {
				for await (const row of rows) yield [row];
			})();
		return nest(
			pages(bundleQuery.stream()),
			() => pages(messageQuery.stream()),
			() => pages(variantQuery.stream())
		);
	}
	// One snapshot for all three scans: bundles, messages, and variants come
	// from the same state even while other writes commit.
	return lix.read((snapshot) =>
		nest(
			streamCompiledQuery(snapshot, bundleQuery.compile()),
			() => streamCompiledQuery(snapshot, messageQuery.compile()),
			() => streamCompiledQuery(snapshot, variantQuery.compile())
		)
	);
}
