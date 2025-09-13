import type { Lix } from "../lix/open-lix.js";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoId } from "../deterministic/index.js";

export function applyChangeProposalDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">
): void {
	createEntityViewsIfNotExists({
		lix,
		schema: LixChangeProposalSchema,
		overrideName: "change_proposal",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		hardcodedVersionId: "global",
		defaultValues: {
			id: () => nanoId({ lix: lix as any }),
			status: () => "open",
		},
	});
}

export const LixChangeProposalSchema = {
	"x-lix-key": "lix_change_proposal",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-foreign-keys": [
		{
			properties: ["source_version_id"],
			references: { schemaKey: "lix_version_descriptor", properties: ["id"] },
		},
		{
			properties: ["target_version_id"],
			references: { schemaKey: "lix_version_descriptor", properties: ["id"] },
		},
	],
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		source_version_id: { type: "string" },
		target_version_id: { type: "string" },
		status: { type: "string", "x-lix-generated": true }, // 'open' | 'accepted' | 'rejected'
	},
	required: ["id", "source_version_id", "target_version_id", "status"],
	additionalProperties: false,
} as const;
LixChangeProposalSchema satisfies LixSchemaDefinition;

export type LixChangeProposal = FromLixSchemaDefinition<
	typeof LixChangeProposalSchema
>;
