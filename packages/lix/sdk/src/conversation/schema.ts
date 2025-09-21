import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import { nanoIdSync } from "../engine/functions/nano-id.js";
import {
	LixConversationSchema,
	LixConversationMessageSchema,
} from "./schema-definition.js";

export function applyConversationDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "hooks">;
}): void {
	// Create both primary and _all views for conversation with default ID generation
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixConversationSchema,
		overrideName: "conversation",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoIdSync({ engine: args.engine }),
		},
	});

	// Create both primary and _all views for conversation_message with default ID generation
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixConversationMessageSchema,
		overrideName: "conversation_message",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoIdSync({ engine: args.engine }),
		},
	});
}
