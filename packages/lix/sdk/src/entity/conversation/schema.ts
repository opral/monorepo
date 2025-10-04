import { createEntityViewsIfNotExists } from "../../entity-views/entity-view-builder.js";
import type { LixEngine } from "../../engine/boot.js";
import {
	LixEntityConversationSchema,
	type LixEntityConversation,
} from "./schema-definition.js";

export function applyEntityConversationDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixEntityConversationSchema,
		// Create views matching the schema/view name used across the codebase
		// e.g. entity_conversation, entity_conversation_all, entity_conversation_history
		overrideName: "entity_conversation",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
	});
}
