import { v7 as uuid_v7 } from "uuid";
import { nanoid } from "../database/nano-id.js";
import {
	INITIAL_VERSION_ID,
	INITIAL_CHANGE_SET_ID,
	INITIAL_WORKING_CHANGE_SET_ID,
	INITIAL_GLOBAL_VERSION_CHANGE_SET_ID,
	INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID,
	LixVersionSchema,
	type LixVersion,
} from "../version/schema.js";
import {
	LixChangeSetSchema,
	LixChangeSetElementSchema,
	type LixChangeSet,
	type LixChangeSetElement,
} from "../change-set/schema.js";
import { LixLabelSchema, type LixLabel } from "../label/schema.js";
import { LixSchemaViewMap } from "../database/schema.js";
import type { Change } from "../change/schema.js";
import type { LixStoredSchema } from "../stored-schema/schema.js";

export type BootstrapChange = Omit<Change, "snapshot_id"> & {
	snapshot_content: any;
};

/**
 * Creates all bootstrap changes needed for a new lix file.
 * All entities are created in a single change set to avoid dependency ordering issues.
 */
export function createBootstrapChanges(): BootstrapChange[] {
	const changes: BootstrapChange[] = [];
	const created_at = new Date().toISOString();

	// 1. Create all required change sets
	const changeSets: LixChangeSet[] = [
		{
			id: INITIAL_GLOBAL_VERSION_CHANGE_SET_ID,
		},
		{
			id: INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID,
		},
		{
			id: INITIAL_CHANGE_SET_ID,
		},
		{
			id: INITIAL_WORKING_CHANGE_SET_ID,
		},
	];

	for (const changeSet of changeSets) {
		changes.push({
			id: uuid_v7(),
			entity_id: changeSet.id,
			schema_key: "lix_change_set",
			schema_version: LixChangeSetSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: changeSet,
			created_at,
		});
	}

	// 2. Create global version
	changes.push({
		id: uuid_v7(),
		entity_id: "global",
		schema_key: "lix_version",
		schema_version: LixVersionSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: {
			id: "global",
			name: "global",
			change_set_id: INITIAL_GLOBAL_VERSION_CHANGE_SET_ID,
			working_change_set_id: INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID,
		} satisfies LixVersion,
		created_at,
	});

	// 3. Create main version
	changes.push({
		id: uuid_v7(),
		entity_id: INITIAL_VERSION_ID,
		schema_key: "lix_version",
		schema_version: LixVersionSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: {
			id: INITIAL_VERSION_ID,
			name: "main",
			change_set_id: INITIAL_CHANGE_SET_ID,
			working_change_set_id: INITIAL_WORKING_CHANGE_SET_ID,
			inherits_from_version_id: "global",
		} satisfies LixVersion,
		created_at,
	});

	// 4. Create default checkpoint label
	const checkpointLabelId = nanoid();
	changes.push({
		id: uuid_v7(),
		entity_id: checkpointLabelId,
		schema_key: "lix_label",
		schema_version: LixLabelSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: {
			id: checkpointLabelId,
			name: "checkpoint",
		} satisfies LixLabel,
		created_at,
	});

	// 5. Create all schema definitions
	for (const schema of Object.values(LixSchemaViewMap)) {
		changes.push({
			id: uuid_v7(),
			entity_id: schema["x-lix-key"],
			schema_key: "lix_stored_schema",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				key: schema["x-lix-key"],
				version: schema["x-lix-version"],
				value: JSON.stringify(schema),
			} satisfies LixStoredSchema,
			created_at,
		});
	}

	// 6. Create change set elements linking all changes to the global change set
	const originalChanges = [...changes]; // snapshot of original changes
	const changeSetElementChanges: BootstrapChange[] = [];

	// First, create change set elements for all original changes
	for (const change of originalChanges) {
		const changeSetElementChange = {
			id: uuid_v7(),
			entity_id: `${INITIAL_GLOBAL_VERSION_CHANGE_SET_ID}::${change.id}`,
			schema_key: "lix_change_set_element",
			schema_version: LixChangeSetElementSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				change_set_id: INITIAL_GLOBAL_VERSION_CHANGE_SET_ID,
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			} satisfies LixChangeSetElement,
			created_at,
		};
		changes.push(changeSetElementChange);
		changeSetElementChanges.push(changeSetElementChange);
	}

	// TODO evaluate if we can come up with a better concept to avoid meta changes (if even desired)
	//
	// this is the cost of change set (elements). we need to track what's in a
	// change set itself. The struggle is that working change set is by definition
	// mutable, and probably other user interactions for a change set too.
	//
	//
	// 7. Create change set elements for the change set element changes themselves
	// (one level of self-reference, then stop to avoid infinite recursion)
	for (const changeSetElementChange of changeSetElementChanges) {
		changes.push({
			id: uuid_v7(),
			entity_id: `${INITIAL_GLOBAL_VERSION_CHANGE_SET_ID}::${changeSetElementChange.id}`,
			schema_key: "lix_change_set_element",
			schema_version: LixChangeSetElementSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				change_set_id: INITIAL_GLOBAL_VERSION_CHANGE_SET_ID,
				change_id: changeSetElementChange.id,
				entity_id: changeSetElementChange.entity_id,
				schema_key: changeSetElementChange.schema_key,
				file_id: changeSetElementChange.file_id,
			} satisfies LixChangeSetElement,
			created_at,
		});
	}

	return changes;
}
