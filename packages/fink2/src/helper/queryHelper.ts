import { Bundle, InlangDatabaseSchema, Message, Variant } from "@inlang/sdk2";
import { Kysely, RawBuilder, sql } from "kysely";

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
				alias: json(bundle.alias) as any, // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
			});
		},
		update: (
			db: Kysely<InlangDatabaseSchema>,
			bundle: Partial<Bundle> & { id: string }
		) => {
			const bundleProperties = structuredClone(bundle as any); // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
			delete bundleProperties.id;
			if (bundle.alias) {
				bundleProperties.alias = json(bundle.alias) as any;
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
				declarations: json(message.declarations) as any, // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
				selectors: json(message.selectors) as any, // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
			});
		},
		update: (
			db: Kysely<InlangDatabaseSchema>,
			message: Partial<Message> & { id: string }
		) => {
			const messageProperties = structuredClone(message as any); // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
			delete messageProperties.id;
			delete messageProperties.variants;
			if (message.declarations) {
				messageProperties.declarations = json(message.declarations) as any;
			}
			if (message.selectors) {
				messageProperties.selectors = json(message.selectors) as any;
			}

			return db
				.updateTable("message")
				.set(messageProperties)
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
				match: json(variant.match) as any, // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
				pattern: json(variant.pattern) as any, // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
			});
		},
		update: (
			db: Kysely<InlangDatabaseSchema>,
			variant: Partial<Variant> & { id: string }
		) => {
			const variantProperties = structuredClone(variant as any); // TODO SDK-v2 KISELY check why kysely complains see https://kysely.dev/docs/recipes/extending-kysely#expression
			delete variantProperties.id;
			if (variant.match) {
				variantProperties.match = json(variant.match) as any;
			}
			if (variant.pattern) {
				variantProperties.pattern = json(variant.pattern) as any;
			}

			return db
				.updateTable("variant")
				.set(variantProperties)
				.where("variant.id", "=", variant.id);
		},
		delete: (db: Kysely<InlangDatabaseSchema>, variant: Variant) => {
			return db.deleteFrom("variant").where("variant.id", "=", variant.id);
		},
	},
};

export default queryHelper;

function json<T>(value: T): RawBuilder<T> {
	// NOTE we cant use jsonb for now since kisley
	// - couldn't find out how to return json instead of bytes in a selectFrom(...).select statment
	//  return sql`jsonb(${JSON.stringify(value)})`
	return sql`json(${JSON.stringify(value)})`;
}
