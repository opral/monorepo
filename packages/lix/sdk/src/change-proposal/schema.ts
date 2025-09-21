import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import { nanoIdSync } from "../engine/functions/nano-id.js";
import {
	LixChangeProposalSchema,
	type LixChangeProposal,
} from "./schema-definition.js";

export function applyChangeProposalDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
}): void {
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: LixChangeProposalSchema,
		overrideName: "change_proposal",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		hardcodedVersionId: "global",
		defaultValues: {
			id: () => nanoIdSync({ engine: args.engine }),
			status: () => "open",
		},
	});
}
