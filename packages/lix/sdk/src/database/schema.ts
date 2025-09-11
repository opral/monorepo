import type { ChangeView, InternalChangeTable } from "../change/schema.js";
import {
	LixChangeSetElementSchema,
	LixChangeSetLabelSchema,
	LixChangeSetSchema,
} from "../change-set/schema.js";
import { LixCommitSchema, LixCommitEdgeSchema } from "../commit/schema.js";
import {
	LixVersionDescriptorSchema,
	type LixActiveVersion,
} from "../version/schema.js";
import { type InternalSnapshotTable } from "../snapshot/schema.js";
import { LixStoredSchemaSchema } from "../stored-schema/schema.js";
import type {
	LixGenerated,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";
import { LixKeyValueSchema, type LixKeyValue } from "../key-value/schema.js";
import type {
	StateView,
	StateAllView,
	StateWithTombstonesView,
} from "../state/index.js";
import type { StateHistoryView } from "../state-history/schema.js";
import { LixFileDescriptorSchema } from "../file/schema.js";
import { LixLogSchema } from "../log/schema.js";
import { LixAccountSchema, type LixActiveAccount } from "../account/schema.js";
import { LixChangeAuthorSchema } from "../change-author/schema.js";
import { LixLabelSchema } from "../label/schema.js";
import { LixEntityLabelSchema } from "../entity/label/schema.js";
import { LixEntityConversationSchema } from "../entity/conversation/schema.js";
import {
	LixConversationSchema,
	LixConversationMessageSchema,
	type LixConversationMessage,
} from "../conversation/schema.js";
import type { EntityViews } from "../entity-views/entity-view-builder.js";
import type { ToKysely } from "../entity-views/types.js";
import type { InternalStateCacheTable } from "../state/cache/schema.js";
import type { InternalResolvedStateAllView } from "../state/resolved-state-view.js";
import type { InternalStateAllUntrackedTable } from "../state/untracked/schema.js";
import type { InternalFileDataCacheTable } from "../file/cache/schema.js";
import type { InternalFileLixcolCacheTable } from "../file/cache/lixcol-schema.js";
import type { InternalTransactionStateTable } from "../state/transaction/schema.js";
import type { InternalStateVTable } from "../state/vtable/vtable.js";

export const LixDatabaseSchemaJsonColumns = {
	snapshot: ["content"],
	change_set: ["metadata"],
} as const;

export type LixInternalDatabaseSchema = LixDatabaseSchema & {
	internal_transaction_state: InternalTransactionStateTable;
	internal_change: InternalChangeTable;
	internal_snapshot: InternalSnapshotTable;
	internal_state_cache: InternalStateCacheTable;
	internal_state_all_untracked: InternalStateAllUntrackedTable;
	internal_resolved_state_all: InternalResolvedStateAllView;
	internal_state_vtable: InternalStateVTable;
	internal_file_data_cache: InternalFileDataCacheTable;
	internal_file_lixcol_cache: InternalFileLixcolCacheTable;
	internal_state_writer: InternalStateWriterTable;
};

export type InternalStateWriterTable = {
	file_id: string;
	version_id: string;
	entity_id: string;
	schema_key: string;
	writer_key: string | null;
};

export const LixSchemaViewMap: Record<string, LixSchemaDefinition> = {
	change_set: LixChangeSetSchema,
	change_set_element: LixChangeSetElementSchema,
	change_set_label: LixChangeSetLabelSchema,
	commit: LixCommitSchema,
	commit_edge: LixCommitEdgeSchema,
	file: LixFileDescriptorSchema,
	log: LixLogSchema,
	stored_schema: LixStoredSchemaSchema,
	key_value: LixKeyValueSchema,
	account: LixAccountSchema,
	change_author: LixChangeAuthorSchema,
	label: LixLabelSchema,
	entity_label: LixEntityLabelSchema,
	entity_conversation: LixEntityConversationSchema,
	conversation: LixConversationSchema,
	conversation_message: LixConversationMessageSchema,
};

export type LixDatabaseSchema = {
	active_account: ToKysely<LixActiveAccount>;
	active_version: ToKysely<LixActiveVersion>;

	state: StateView;
	state_all: StateAllView;
	state_with_tombstones: StateWithTombstonesView;
	state_history: StateHistoryView;

	change: ChangeView;
} & EntityViews<
	typeof LixKeyValueSchema,
	"key_value",
	{ value: LixKeyValue["value"] }
> &
	EntityViews<typeof LixAccountSchema, "account"> &
	EntityViews<typeof LixChangeSetSchema, "change_set"> &
	EntityViews<typeof LixChangeSetElementSchema, "change_set_element"> &
	EntityViews<typeof LixChangeSetLabelSchema, "change_set_label"> &
	EntityViews<typeof LixChangeAuthorSchema, "change_author"> &
	EntityViews<typeof LixFileDescriptorSchema, "file", { data: Uint8Array }> &
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
	EntityViews<
		typeof LixVersionDescriptorSchema,
		"version",
		{ commit_id: LixGenerated<string> }
	> &
	EntityViews<typeof LixCommitSchema, "commit"> &
	EntityViews<typeof LixCommitEdgeSchema, "commit_edge">;
