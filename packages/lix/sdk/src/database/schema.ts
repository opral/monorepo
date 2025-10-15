import type {
	ChangeView,
	InternalChangeTable,
} from "../change/schema-definition.js";
import {
	LixChangeSetElementSchema,
	LixChangeSetSchema,
} from "../change-set/schema-definition.js";
import {
	LixCommitSchema,
	LixCommitEdgeSchema,
} from "../commit/schema-definition.js";
import {
	LixVersionDescriptorSchema,
	type LixActiveVersion,
} from "../version/schema-definition.js";
import { type InternalSnapshotTable } from "../snapshot/schema.js";
import { LixStoredSchemaSchema } from "../stored-schema/schema-definition.js";
import type {
	FromLixSchemaDefinition,
	LixGenerated,
} from "../schema-definition/definition.js";
import {
	LixKeyValueSchema,
	type LixKeyValue,
} from "../key-value/schema-definition.js";
import type {
	StateView,
	StateAllView,
	StateWithTombstonesView,
} from "../state/index.js";
import type { StateHistoryView } from "../state-history/schema.js";
import { LixDirectoryDescriptorSchema } from "../filesystem/directory/schema-definition.js";
import { LixFileDescriptorSchema } from "../filesystem/file/schema-definition.js";
import type {
	EntityStateAllView,
	EntityStateHistoryView,
	EntityStateView,
} from "../entity-views/types.js";
import { LixLogSchema } from "../log/schema-definition.js";
import {
	LixAccountSchema,
	LixActiveAccountSchema,
} from "../account/schema-definition.js";
import { LixChangeAuthorSchema } from "../change-author/schema-definition.js";
import { LixLabelSchema } from "../label/schema-definition.js";
import { LixEntityLabelSchema } from "../entity/label/schema-definition.js";
import { LixEntityConversationSchema } from "../entity/conversation/schema-definition.js";
import {
	LixConversationSchema,
	LixConversationMessageSchema,
	type LixConversationMessage,
} from "../conversation/schema-definition.js";
import { LixChangeProposalSchema } from "../change-proposal/schema-definition.js";
import type { EntityViews } from "../entity-views/entity-view-builder.js";
import type { ToKysely } from "../entity-views/types.js";
import type { InternalStateCacheTable } from "../state/cache/schema.js";
import type { InternalStateAllUntrackedTable } from "../state/untracked/schema.js";
import type { InternalFileDataCacheTable } from "../filesystem/file/cache/schema.js";
import type { InternalFileLixcolCacheTable } from "../filesystem/file/cache/lixcol-schema.js";
import type { InternalTransactionStateTable } from "../state/transaction/schema.js";
import type { InternalStateVTable } from "../state/vtable/vtable.js";

export const LixDatabaseSchemaJsonColumns = {
	snapshot: ["content"],
	change_set: ["metadata"],
} as const;

export type LixInternalDatabaseSchema = LixDatabaseSchema & {
	lix_internal_transaction_state: InternalTransactionStateTable;
	lix_internal_change: InternalChangeTable;
	lix_internal_snapshot: InternalSnapshotTable;
	lix_internal_state_all_untracked: InternalStateAllUntrackedTable;
	lix_internal_state_vtable: InternalStateVTable;
	lix_internal_state_reader: InternalStateVTable;
	lix_internal_file_data_cache: InternalFileDataCacheTable;
	lix_internal_file_lixcol_cache: InternalFileLixcolCacheTable;
	lix_internal_state_writer: InternalStateWriterTable;
};

export type InternalStateWriterTable = {
	file_id: string;
	version_id: string;
	entity_id: string;
	schema_key: string;
	writer_key: string | null;
};

type DirectoryDescriptorView = ToKysely<
	EntityStateView<
		FromLixSchemaDefinition<typeof LixDirectoryDescriptorSchema> & {
			path: LixGenerated<string>;
		}
	>
>;
type DirectoryDescriptorAllView = ToKysely<
	EntityStateAllView<
		FromLixSchemaDefinition<typeof LixDirectoryDescriptorSchema> & {
			path: LixGenerated<string>;
		}
	>
>;
type DirectoryDescriptorHistoryView = ToKysely<
	EntityStateHistoryView<
		FromLixSchemaDefinition<typeof LixDirectoryDescriptorSchema> & {
			path: LixGenerated<string>;
		}
	>
>;

export type LixDatabaseSchema = {
	active_account: EntityViews<
		typeof LixActiveAccountSchema,
		"active_account"
	>["active_account"];
	active_version: ToKysely<LixActiveVersion>;

	state: StateView;
	state_all: StateAllView;
	state_with_tombstones: StateWithTombstonesView;
	state_history: StateHistoryView;

	change: ChangeView;
	directory: DirectoryDescriptorView;
	directory_all: DirectoryDescriptorAllView;
	directory_history: DirectoryDescriptorHistoryView;
} & EntityViews<
	typeof LixKeyValueSchema,
	"key_value",
	{ value: LixKeyValue["value"] }
> &
	EntityViews<typeof LixAccountSchema, "account"> &
	EntityViews<typeof LixChangeSetSchema, "change_set"> &
	EntityViews<typeof LixChangeSetElementSchema, "change_set_element"> &
	EntityViews<typeof LixChangeAuthorSchema, "change_author"> &
	EntityViews<
		typeof LixFileDescriptorSchema,
		"file",
		{
			data: Uint8Array;
			path: LixGenerated<string>;
			directory_id: LixGenerated<string | null>;
			name: LixGenerated<string>;
			extension: LixGenerated<string | null>;
		}
	> &
	EntityViews<typeof LixLabelSchema, "label"> &
	EntityViews<typeof LixEntityLabelSchema, "entity_label"> &
	EntityViews<typeof LixEntityConversationSchema, "entity_conversation"> &
	EntityViews<typeof LixStoredSchemaSchema, "stored_schema", { value: any }> &
	EntityViews<typeof LixLogSchema, "log"> &
	EntityViews<typeof LixConversationSchema, "conversation"> &
	EntityViews<
		typeof LixConversationMessageSchema,
		"conversation_message",
		{ body: LixConversationMessage["body"] }
	> &
	EntityViews<typeof LixChangeProposalSchema, "change_proposal"> &
	EntityViews<
		typeof LixVersionDescriptorSchema,
		"version",
		{ commit_id: LixGenerated<string>; working_commit_id: LixGenerated<string> }
	> &
	EntityViews<typeof LixCommitSchema, "commit"> &
	EntityViews<typeof LixCommitEdgeSchema, "commit_edge">;
