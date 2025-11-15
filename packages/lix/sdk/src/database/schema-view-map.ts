import {
	LixAccountSchema,
	LixActiveAccountSchema,
} from "../account/schema-definition.js";
import { LixChangeAuthorSchema } from "../change-author/schema-definition.js";
import { LixChangeProposalSchema } from "../change-proposal/schema-definition.js";
import {
	LixChangeSetElementSchema,
	LixChangeSetSchema,
} from "../change-set/schema-definition.js";
import {
	LixCommitEdgeSchema,
	LixCommitSchema,
} from "../commit/schema-definition.js";
import {
	LixConversationMessageSchema,
	LixConversationSchema,
} from "../conversation/schema-definition.js";
import { LixEntityConversationSchema } from "../entity/conversation/schema-definition.js";
import { LixEntityLabelSchema } from "../entity/label/schema-definition.js";
import { LixDirectoryDescriptorSchema } from "../filesystem/directory/schema-definition.js";
import { LixFileDescriptorSchema } from "../filesystem/file/schema-definition.js";
import { LixKeyValueSchema } from "../key-value/schema-definition.js";
import { LixLabelSchema } from "../label/schema-definition.js";
import { LixLogSchema } from "../log/schema-definition.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { LixStoredSchemaSchema } from "../stored-schema/schema-definition.js";

export const LixSchemaViewMap: Record<string, LixSchemaDefinition> = {
	change_set: LixChangeSetSchema,
	change_set_element: LixChangeSetElementSchema,
	commit: LixCommitSchema,
	commit_edge: LixCommitEdgeSchema,
	file_descriptor: LixFileDescriptorSchema,
	directory_descriptor: LixDirectoryDescriptorSchema,
	log: LixLogSchema,
	stored_schema: LixStoredSchemaSchema,
	key_value: LixKeyValueSchema,
	account: LixAccountSchema,
	active_account: LixActiveAccountSchema,
	change_author: LixChangeAuthorSchema,
	label: LixLabelSchema,
	entity_label: LixEntityLabelSchema,
	entity_conversation: LixEntityConversationSchema,
	conversation: LixConversationSchema,
	conversation_message: LixConversationMessageSchema,
	change_proposal: LixChangeProposalSchema,
};
