import { describe, expect, test } from "vitest";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { buildSchemaIndexSpecs } from "./schema-indexes.js";

describe("buildSchemaIndexSpecs", () => {
	test("creates primary key index", () => {
		const schema: LixSchemaDefinition = {
			"x-lix-key": "bench_pk",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				id: { type: "string" },
				code: { type: "string" },
			},
			required: ["id", "code"],
			"x-lix-primary-key": ["/code"],
		} as const;

		const specs = buildSchemaIndexSpecs(schema);

		expect(specs).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "pk",
					unique: true,
					columns: ["version_id", "json_extract(snapshot_content, '$.code')"],
				}),
			])
		);
	});

	test("creates unique index for nested pointer", () => {
		const schema: LixSchemaDefinition = {
			"x-lix-key": "bench_unique",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				id: { type: "string" },
				details: {
					type: "object",
					additionalProperties: false,
					properties: { slug: { type: "string" } },
				},
			},
			required: ["id", "details"],
			"x-lix-unique": [["/details/slug"]],
		} as const;

		const specs = buildSchemaIndexSpecs(schema);

		expect(specs).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "unique",
					unique: true,
					columns: [
						"version_id",
						"json_extract(snapshot_content, '$.details.slug')",
					],
				}),
			])
		);
	});

	test("creates foreign key index for immediate mode", () => {
		const schema: LixSchemaDefinition = {
			"x-lix-key": "bench_fk",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				id: { type: "string" },
				target_id: { type: "string" },
			},
			required: ["id", "target_id"],
			"x-lix-foreign-keys": [
				{
					properties: ["/target_id"],
					references: { schemaKey: "bench_target", properties: ["/id"] },
				},
			],
		} as const;

		const specs = buildSchemaIndexSpecs(schema);

		expect(specs).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "foreign",
					columns: [
						"version_id",
						"inherited_from_version_id",
						"json_extract(snapshot_content, '$.target_id')",
					],
				}),
			])
		);
	});
});
