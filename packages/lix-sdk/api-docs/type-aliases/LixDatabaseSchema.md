[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixDatabaseSchema

# Type Alias: LixDatabaseSchema

> **LixDatabaseSchema** = `object` & `EntityViews`\<*typeof* [`LixKeyValueSchema`](../variables/LixKeyValueSchema.md), `"key_value"`, \{ `value`: [`KeyValue`](KeyValue.md)\[`"value"`\]; \}\> & `EntityViews`\<*typeof* [`LixAccountSchema`](../variables/LixAccountSchema.md), `"account"`\> & `EntityViews`\<*typeof* [`LixChangeSetSchema`](../variables/LixChangeSetSchema.md), `"change_set"`\> & `EntityViews`\<*typeof* [`LixChangeSetElementSchema`](../variables/LixChangeSetElementSchema.md), `"change_set_element"`\> & `EntityViews`\<*typeof* [`LixChangeSetEdgeSchema`](../variables/LixChangeSetEdgeSchema.md), `"change_set_edge"`\> & `EntityViews`\<*typeof* [`LixChangeSetLabelSchema`](../variables/LixChangeSetLabelSchema.md), `"change_set_label"`\> & `EntityViews`\<*typeof* [`LixChangeSetThreadSchema`](../variables/LixChangeSetThreadSchema.md), `"change_set_thread"`\> & `EntityViews`\<*typeof* `LixChangeAuthorSchema`, `"change_author"`\> & `EntityViews`\<*typeof* [`LixFileSchema`](../variables/LixFileSchema.md), `"file"`, \{ `data`: `Uint8Array`; \}\> & `EntityViews`\<*typeof* [`LixLabelSchema`](../variables/LixLabelSchema.md), `"label"`\> & `EntityViews`\<*typeof* `LixStoredSchemaSchema`, `"stored_schema"`, \{ `value`: `any`; \}\> & `EntityViews`\<*typeof* [`LixLogSchema`](../variables/LixLogSchema.md), `"log"`\> & `EntityViews`\<*typeof* [`LixThreadSchema`](../variables/LixThreadSchema.md), `"thread"`\> & `EntityViews`\<*typeof* [`LixThreadCommentSchema`](../variables/LixThreadCommentSchema.md), `"thread_comment"`, \{ `body`: [`ThreadComment`](ThreadComment.md)\[`"body"`\]; \}\> & `EntityViews`\<*typeof* [`LixVersionSchema`](../variables/LixVersionSchema.md), `"version"`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:74](https://github.com/opral/monorepo/blob/f6145848c50035d05b8b3729072a23a67228ebc3/packages/lix-sdk/src/database/schema.ts#L74)

## Type declaration

### active\_account

> **active\_account**: [`ActiveAccountTable`](ActiveAccountTable.md)

### active\_version

> **active\_version**: [`ActiveVersionTable`](ActiveVersionTable.md)

### change

> **change**: [`ChangeView`](ChangeView.md)

### snapshot

> **snapshot**: [`ToKysely`](ToKysely.md)\<[`Snapshot`](Snapshot.md)\>

### state

> **state**: `StateView`

### state\_active

> **state\_active**: `StateView`

### state\_history

> **state\_history**: `StateHistoryView`
