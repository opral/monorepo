import { Bundle, InlangDatabaseSchema, Message, Variant } from "@inlang/sdk2";
import { Kysely } from "kysely";

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
			return db.insertInto("bundle").values(bundle);
		},
		update: (
			db: Kysely<InlangDatabaseSchema>,
			bundle: Partial<Bundle> & { id: string }
		) => {
			const bundleProperties = structuredClone(bundle);
			// @ts-expect-error - ts doesn't expect id to be removed
			delete bundleProperties.id;
			if (bundle.alias) {
				bundleProperties.alias = bundle.alias;
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
			return db.insertInto("message").values(message);
		},
		update: (
			db: Kysely<InlangDatabaseSchema>,
			message: Partial<Message> & { id: string }
		) => {
			return db
				.updateTable("message")
				.set(message)
				.where("message.id", "=", message.id);
		},
		delete: (db: Kysely<InlangDatabaseSchema>, message: Message) => {
			return db.deleteFrom("message").where("message.id", "=", message.id);
		},
	},
	variant: {
		select: (db: Kysely<InlangDatabaseSchema>) => db.selectFrom("variant"),
		insert: (db: Kysely<InlangDatabaseSchema>, variant: Variant) => {
			return db.insertInto("variant").values(variant);
		},
		update: (
			db: Kysely<InlangDatabaseSchema>,
			variant: Partial<Variant> & { id: string }
		) => {
			return db
				.updateTable("variant")
				.set(variant)
				.where("variant.id", "=", variant.id);
		},
		delete: (db: Kysely<InlangDatabaseSchema>, variant: Variant) => {
			return db.deleteFrom("variant").where("variant.id", "=", variant.id);
		},
	},
};

export default queryHelper;

