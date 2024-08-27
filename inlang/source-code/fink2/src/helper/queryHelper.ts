import { Bundle, InlangDatabaseSchema, Message, Variant } from "@inlang/sdk2";
import { Kysely } from "kysely";
import { json } from "./toJSONRawBuilder.ts";

/**
 * @deprecated json mapping happens automatically https://github.com/opral/monorepo/pull/3078 
 *             use the query api directly.
 */
const queryHelper = {
	bundle: {
		/*
        search: (args: { lintRulesIds: string[], locales: LanguageTag[], bundleIds: string[], text: string }): string[] {
            const query = // my fancy search query
            return {
                result: async () => {

                }
                subscribe: (cb) => {
                    
                    return {
                        unsubscribe: () => {

                        }
                    }
                }
            }
        },
        */
		select: (db: Kysely<InlangDatabaseSchema>) => db.selectFrom("bundle"),
		insert: (db: Kysely<InlangDatabaseSchema>, bundle: Bundle) => {
			return db.insertInto("bundle").values({
				id: bundle.id,
				alias: json(bundle.alias), // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
			});
		},
		update: (
			db: Kysely<InlangDatabaseSchema>,
			bundle: Partial<Bundle> & { id: string }
		) => {
			const bundleProperties = structuredClone(bundle as any); // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
			delete bundleProperties.id;
			if (bundle.alias) {
				bundleProperties.alias = json(bundle.alias);
			}
			return db
				.updateTable("bundle")
				.set(bundleProperties)
				.where("bundle.id", "=", bundle.id);
		},
		delete: (db: Kysely<InlangDatabaseSchema>, bundle: Bundle) => {
			return db.deleteFrom("bundle").where("bundle.id", "=", bundle.id);
		},
	},
	message: {
		select: (db: Kysely<InlangDatabaseSchema>) => db.selectFrom("message"),
		insert: (db: Kysely<InlangDatabaseSchema>, message: Message) => {
			return db.insertInto("message").values({
				id: message.id,
				bundleId: message.bundleId,
				locale: message.locale,
				declarations: json(message.declarations), // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
				selectors: json(message.selectors), // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
			});
		},
		update: (
			db: Kysely<InlangDatabaseSchema>,
			message: Partial<Message> & { id: string }
		) => {
			return db
				.updateTable("message")
				.set({
					id: message.id,
					bundleId: message.bundleId,
					locale: message.locale,
					declarations: json(message.declarations),
					selectors: json(message.selectors),
				})
				.where("message.id", "=", message.id);
		},
		delete: (db: Kysely<InlangDatabaseSchema>, message: Message) => {
			return db.deleteFrom("message").where("message.id", "=", message.id);
		},
	},
	variant: {
		select: (db: Kysely<InlangDatabaseSchema>) => db.selectFrom("variant"),
		insert: (db: Kysely<InlangDatabaseSchema>, variant: Variant) => {
			return db.insertInto("variant").values({
				id: variant.id,
				messageId: variant.messageId,
				match: json(variant.match),
				pattern: json(variant.pattern),
			});
		},
		update: (
			db: Kysely<InlangDatabaseSchema>,
			variant: Partial<Variant> & { id: string }
		) => {
			return db
				.updateTable("variant")
				.set({
					id: variant.id,
					messageId: variant.messageId,
					match: json(variant.match),
					pattern: json(variant.pattern),
				})
				.where("variant.id", "=", variant.id);
		},
		delete: (db: Kysely<InlangDatabaseSchema>, variant: Variant) => {
			return db.deleteFrom("variant").where("variant.id", "=", variant.id);
		},
	},
};

export default queryHelper;

