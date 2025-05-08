export const VersionViewJsonSchema = {
	$schema: "http://json-schema.org/draft-07/schema#",
	version: "1.0",
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
		change_set_id: { type: "string" },
	},
	required: ["id", "name", "change_set_id"],
} as const;
