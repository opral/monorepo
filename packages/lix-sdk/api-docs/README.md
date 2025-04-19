# Lix SDK API Reference

## applyAccountDatabaseSchema

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / applyAccountDatabaseSchema

# Function: applyAccountDatabaseSchema()

> **applyAccountDatabaseSchema**(`sqlite`): `SqliteWasmDatabase`

Defined in: [packages/lix-sdk/src/account/database-schema.ts:5](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L5)

## Parameters

### sqlite

`SqliteWasmDatabase`

## Returns

`SqliteWasmDatabase`

---

## applyChanges

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / applyChanges

# Function: applyChanges()

> **applyChanges**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/change/apply-changes.ts:24](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/change/apply-changes.ts#L24)

Applies the given changes to the lix.

Calls the `applyChanges` method of the corresponding plugin for each change.
**Carefull**, the changes are not validated before applying them. It is up to
the caller to ensure that the changes are valid. Usually, only the leaf changes
of a given version should be applied.

## Parameters

### args

#### changes

`object`[]

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"` \| `"plugin"`\>

## Returns

`Promise`\<`void`\>

## Example

```ts
  const changes = await lix.db.selectFrom("change")
     .where(changeIsLeafInVersion(currentVersion))
     .selectAll()
     .execute();

  await applyChanges({ lix, changes });
  ```

---

## applyKeyValueDatabaseSchema

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / applyKeyValueDatabaseSchema

# Function: applyKeyValueDatabaseSchema()

> **applyKeyValueDatabaseSchema**(`sqlite`): `SqliteWasmDatabase`

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:4](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/key-value/database-schema.ts#L4)

## Parameters

### sqlite

`SqliteWasmDatabase`

## Returns

`SqliteWasmDatabase`

---

## changeConflictInVersion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeConflictInVersion

# Function: changeConflictInVersion()

> **changeConflictInVersion**(`version`): (`eb`) => `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_conflict"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-conflict-in-version.ts:15](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/query-filter/change-conflict-in-version.ts#L15)

Filters if a conflict is in the given version.

## Parameters

### version

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

## Returns

> (`eb`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_conflict"`, `SqlBool`\>

### Parameters

#### eb

`ExpressionBuilder`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_conflict"`\>

### Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_conflict"`, `SqlBool`\>

## Example

```ts
  const conflicts = await lix.db.selectFrom("change_conflict")
     .where(changeConflictInVersion(currentVersion))
     .selectAll()
     .execute();
  ```

---

## changeHasLabel

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeHasLabel

# Function: changeHasLabel()

> **changeHasLabel**(`name`): (`eb`) => `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-has-label.ts:25](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/query-filter/change-has-label.ts#L25)

Selects changes that have a label with the given name.

## Parameters

### name

`string`

## Returns

> (`eb`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

### Parameters

#### eb

`ExpressionBuilder`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`\>

### Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Examples

```ts
  await lix.db.selectFrom("change")
     .where(changeHasLabel("checkpoint"))
     .selectAll()
     .execute();
  ```

You can use eb.not() to negate the filter.

  ```ts
  await lix.db.selectFrom("change")
		.where((eb) => eb.not(changeHasLabel("checkpoint")))
		.selectAll()
		.execute();
  ```

---

## changeInVersion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeInVersion

# Function: changeInVersion()

> **changeInVersion**(`version`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-in-version.ts:16](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/query-filter/change-in-version.ts#L16)

Filters if a change is in the given Version.

## Parameters

### version

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

## Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Example

```ts
  const changes = await lix.db.selectFrom("change")
     .where(changeInVersion(currentVersion))
     .selectAll()
     .execute();
  ```

---

## changeIsLeaf

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeIsLeaf

# Function: changeIsLeaf()

> **changeIsLeaf**(): (`eb`) => `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-is-leaf.ts:18](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/query-filter/change-is-leaf.ts#L18)

Selects changes that are not a parent of any other change.

**Careful**: This filter is not specific to any version.
If you want to filter changes in a specific version, use `changeIsLeafInversion`.

## Returns

> (`eb`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

### Parameters

#### eb

`ExpressionBuilder`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`\>

### Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Example

```ts
  await lix.db.selectFrom("change")
    .where(changeIsLeaf())
    .selectAll()
    .execute();
  ```

---

## changeIsLeafInVersion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeIsLeafInVersion

# Function: changeIsLeafInVersion()

> **changeIsLeafInVersion**(`version`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-is-leaf-in-version.ts:16](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/query-filter/change-is-leaf-in-version.ts#L16)

Selects changes that are not a parent of any other change within the specified version.

## Parameters

### version

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

## Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Example

```ts
  await lix.db.selectFrom("change")
    .where(changeIsLeafInVersion(currentVersion))
    .selectAll()
    .execute();
  ```

---

## changeIsLeafOf

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeIsLeafOf

# Function: changeIsLeafOf()

> **changeIsLeafOf**(`change`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-is-leaf-of.ts:29](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/query-filter/change-is-leaf-of.ts#L29)

Filter to select the last descendant of the specified change.

## Parameters

### change

`Pick`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}, `"id"`\>

## Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Examples

Checking for the leaf of a change in all versiones.

  ```ts
  await lix.db.selectFrom("change")
     .where(changeIsLeafOf(someChange))
     .selectAll()
     .execute();
  ```

Checking for the leaf of a change in a specific version.

  ```ts
  await lix.db.selectFrom("change")
    .where(changeIsLeafOf(someChange))
    .where(changeInVersion(someVersion))
    .selectAll()
    .execute();
  ```

---

## changeIsLowestCommonAncestorOf

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeIsLowestCommonAncestorOf

# Function: changeIsLowestCommonAncestorOf()

> **changeIsLowestCommonAncestorOf**(`changes`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-is-lowest-common-ancestor-of.ts:16](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/query-filter/change-is-lowest-common-ancestor-of.ts#L16)

Filters changes that are the lowest common ancestor of the given changes.

## Parameters

### changes

`Pick`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}, `"id"`\>[]

## Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change"`, `SqlBool`\>

## Example

```ts
  const lowestCommonAncestor = await lix.db.selectFrom("change")
     .where(changeIsLowestCommonAncestorOf([change1, change2, change3]))
     .selectAll()
     .executeTakeFirst();
  ```

---

## changeSetElementInSymmetricDifference

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeSetElementInSymmetricDifference

# Function: changeSetElementInSymmetricDifference()

> **changeSetElementInSymmetricDifference**(`a`, `b`): (`eb`) => `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set_element"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/change-set/change-set-element-in-symmetric-difference.ts:19](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/change-set/change-set-element-in-symmetric-difference.ts#L19)

Returns the symmetric difference between two change sets.

The symmetric difference is the set of changes
that exist in either one version but not both.
Modeled after https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/symmetricDifference

## Parameters

### a

`Pick`\<\{ `id`: `string`; \}, `"id"`\>

### b

`Pick`\<\{ `id`: `string`; \}, `"id"`\>

## Returns

> (`eb`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set_element"`, `SqlBool`\>

### Parameters

#### eb

`ExpressionBuilder`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set_element"`\>

### Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set_element"`, `SqlBool`\>

## Example

```ts
  await lix.db.selectFrom("change_set_element")
    .where(changeSetElementInSymmetricDifference(a: changeSetA, b: changeSetB))
    .selectAll()
    .execute();
  ```

---

## changeSetHasLabel

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / changeSetHasLabel

# Function: changeSetHasLabel()

> **changeSetHasLabel**(`name`): (`eb`) => `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set"`, `SqlBool`\>

Defined in: [packages/lix-sdk/src/query-filter/change-set-has-label.ts:25](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/query-filter/change-set-has-label.ts#L25)

Selects change sets that have a label with the given name.

## Parameters

### name

`string`

## Returns

> (`eb`): `ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set"`, `SqlBool`\>

### Parameters

#### eb

`ExpressionBuilder`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set"`\>

### Returns

`ExpressionWrapper`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md), `"change_set"`, `SqlBool`\>

## Examples

```ts
  await lix.db.selectFrom("change_set")
     .where(changeSetHasLabel("checkpoint"))
     .selectAll()
     .execute();
  ```

You can use eb.not() to negate the filter.

  ```ts
  await lix.db.selectFrom("change_set")
		.where((eb) => eb.not(changeSetHasLabel("checkpoint")))
		.selectAll()
		.execute();
  ```

---

## closeLix

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / closeLix

# Function: closeLix()

> **closeLix**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/lix/close-lix.ts:6](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/lix/close-lix.ts#L6)

Closes the lix.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

## Returns

`Promise`\<`void`\>

---

## createAccount

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createAccount

# Function: createAccount()

> **createAccount**(`args`): `Promise`\<\{ `id`: `string`; `name`: `string`; \}\>

Defined in: [packages/lix-sdk/src/account/create-account.ts:4](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/create-account.ts#L4)

## Parameters

### args

#### lix

[`Lix`](../type-aliases/Lix.md)

#### name

`string`

## Returns

`Promise`\<\{ `id`: `string`; `name`: `string`; \}\>

---

## createChange

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createChange

# Function: createChange()

> **createChange**(`args`, `options?`): `Promise`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}\>

Defined in: [packages/lix-sdk/src/change/create-change.ts:15](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/change/create-change.ts#L15)

Programatically create a change in the database.

Use this function to directly create a change from a lix app
with bypassing of file-based change detection.

## Parameters

### args

#### authors

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>[]

#### entityId

`string`

#### fileId

`string`

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"` \| `"sqlite"`\>

#### pluginKey

`string`

#### schemaKey

`string`

#### snapshotContent

`null` \| `Record`\<`string`, `any`\>

#### version

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

### options?

#### updateVersionChanges?

`boolean`

When true, the version changes will be updated.

Defaults to true.

## Returns

`Promise`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}\>

---

## createChangeConflict

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createChangeConflict

# Function: createChangeConflict()

> **createChangeConflict**(`args`): `Promise`\<\{ `change_set_id`: `string`; `id`: `string`; `key`: `string`; \}\>

Defined in: [packages/lix-sdk/src/change-conflict/create-change-conflict.ts:10](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/change-conflict/create-change-conflict.ts#L10)

Creates a new change conflict with the given conflicting changes.

## Parameters

### args

#### conflictingChangeIds

`Set`\<`string`\>

#### key

`string`

The key of the change conflict.

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### version

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

## Returns

`Promise`\<\{ `change_set_id`: `string`; `id`: `string`; `key`: `string`; \}\>

---

## createChangeSet

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createChangeSet

# Function: createChangeSet()

> **createChangeSet**(`args`): `Promise`\<\{ `id`: `string`; \}\>

Defined in: [packages/lix-sdk/src/change-set/create-change-set.ts:24](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/change-set/create-change-set.ts#L24)

Creates a change set with the given changes, optionally within an open transaction.

## Parameters

### args

#### changes

`Pick`\<\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}, `"id"`\>[]

#### labels?

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>[]

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

## Returns

`Promise`\<\{ `id`: `string`; \}\>

## Examples

```ts
  const changes = await lix.db.selectFrom("change").selectAll().execute();
  const changeSet = await createChangeSet({ db: lix.db, changes });
  ```

```ts
  // Create a change set with labels
  const labels = await lix.db.selectFrom("label").selectAll().execute();
  const changeSet = await createChangeSet({
    lix,
    changes: [],
    labels
  });
  ```

---

## createComment

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createComment

# Function: createComment()

> **createComment**(`args`): `Promise`\<\{ `content`: `string`; `discussion_id`: `string`; `id`: `string`; `parent_id`: `null` \| `string`; \}\>

Defined in: [packages/lix-sdk/src/discussion/create-comment.ts:4](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/discussion/create-comment.ts#L4)

## Parameters

### args

#### content

`string`

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### parentComment

`Pick`\<\{ `content`: `string`; `discussion_id`: `string`; `id`: `string`; `parent_id`: `null` \| `string`; \}, `"id"` \| `"discussion_id"`\>

## Returns

`Promise`\<\{ `content`: `string`; `discussion_id`: `string`; `id`: `string`; `parent_id`: `null` \| `string`; \}\>

---

## createDiscussion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createDiscussion

# Function: createDiscussion()

> **createDiscussion**(`args`): `Promise`\<`object` & `object`\>

Defined in: [packages/lix-sdk/src/discussion/create-discussion.ts:15](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/discussion/create-discussion.ts#L15)

Creates a new discussion with the first comment.

## Parameters

### args

#### changeSet

`Pick`\<\{ `id`: `string`; \}, `"id"`\>

#### firstComment

`Pick`\<\{ `content`: `string`; `discussion_id`: `string`; `id`: `string`; `parent_id`: `null` \| `string`; \}, `"content"`\>

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

## Returns

`Promise`\<`object` & `object`\>

the created discussion

## Example

```ts
  const changeSet = await createChangeSet({ lix, changes: ["change1", "change2"] });
  const discussion = await createDiscussion({ lix, changeSet, firstComment: { content: "first comment" } });
  ```

---

## createLspInMemoryEnvironment

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createLspInMemoryEnvironment

# Function: createLspInMemoryEnvironment()

> **createLspInMemoryEnvironment**(): `LspEnvironment`

Defined in: [packages/lix-sdk/src/server-protocol-handler/environment/create-in-memory-environment.ts:13](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/server-protocol-handler/environment/create-in-memory-environment.ts#L13)

Create an in-memory storage.

Great for testing or quick prototyping.

## Returns

`LspEnvironment`

---

## createServerProtocolHandler

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createServerProtocolHandler

# Function: createServerProtocolHandler()

> **createServerProtocolHandler**(`args`): `Promise`\<`LixServerProtocolHandler`\>

Defined in: [packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts:55](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts#L55)

The handler for the lix server protocol.

## Parameters

### args

#### environment

`LspEnvironment`

## Returns

`Promise`\<`LixServerProtocolHandler`\>

## Examples

Usage with a server framework.

  ```ts
	 // any server framework goes
  // here, like express, polka, etc.
  // frameworks that do not use
  // web standard Request and Response
  // objects will need to be mapped.
  const app = new Hono();

  const lspHandler = createServerProtocolHandler({ storage });

  app.use('/lsp/*', async (req) => {
     await lspHandler(req);
  });
  ```

Testing the handler.

  ```ts
  const lspHandler = createServerProtocolHandler({ storage });
  const request = new Request('/lsp/new', {
    method: 'POST',
    body: new Blob(['...']),
  });

  const response = await lspHandler(request);

  expect(response).to(...);
  ```

---

## createSnapshot

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createSnapshot

# Function: createSnapshot()

> **createSnapshot**(`args`): `Promise`\<\{ `content`: `null` \| `Record`\<`string`, `any`\>; `id`: `string`; \}\>

Defined in: [packages/lix-sdk/src/snapshot/create-snapshot.ts:15](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/snapshot/create-snapshot.ts#L15)

Creates a snapshot and inserts it or retrieves the existing snapshot from the database.

Snapshots are content-addressed to avoid storing the same snapshot multiple times.
Hence, an insert might not actually insert a new snapshot but return an existing one.

## Parameters

### args

#### content?

`null` \| `Record`\<`string`, `any`\>

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

## Returns

`Promise`\<\{ `content`: `null` \| `Record`\<`string`, `any`\>; `id`: `string`; \}\>

## Example

```ts
  const snapshot = await createSnapshot({ lix, content });
  ```

---

## createVersion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createVersion

# Function: createVersion()

> **createVersion**(`args`): `Promise`\<\{ `id`: `string`; `name`: `string`; \}\>

Defined in: [packages/lix-sdk/src/version/create-version.ts:23](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/version/create-version.ts#L23)

Creates a new Version.

If `from` is provided, the new version will be identical to the from version.

## Parameters

### args

#### from?

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### name?

`string`

## Returns

`Promise`\<\{ `id`: `string`; `name`: `string`; \}\>

## Examples

_Without from_

  ```ts
  const version = await createVersion({ lix });
  ```

_With from_

  ```ts
  const version = await createVersion({ lix, from: otherVersion });
  ```

---

## detectChangeConflicts

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / detectChangeConflicts

# Function: detectChangeConflicts()

> **detectChangeConflicts**(`args`): `Promise`\<[`DetectedConflict`](../type-aliases/DetectedConflict.md)[]\>

Defined in: [packages/lix-sdk/src/change-conflict/detect-change-conflicts.ts:21](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/change-conflict/detect-change-conflicts.ts#L21)

Detects conflicts in the given set of changes.

The caller is responsible for filtering out changes
that should not lead to conflicts before calling this function.

For example, detecting conflicts between two versiones should
only include changes that are different between the two versiones
when calling this function.

## Parameters

### args

#### changes

`object`[]

#### lix

`Pick`\<[`LixReadonly`](../type-aliases/LixReadonly.md), `"db"` \| `"plugin"`\>

## Returns

`Promise`\<[`DetectedConflict`](../type-aliases/DetectedConflict.md)[]\>

## Example

```ts
const detectedConflicts = await detectChangeConflicts({
       lix: lix,
       changes: diffingChages,
  });
```

---

## executeSync

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / executeSync

# Function: executeSync()

> **executeSync**(`args`): `any`[]

Defined in: [packages/lix-sdk/src/database/execute-sync.ts:15](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/execute-sync.ts#L15)

Execute a query synchronously.

WARNING: This function is not recommended for general use.
Only if you need sync queries, like in a trigger for exmaple,
you should use this function. The function is not transforming
the query or the result as the db API does. You get raw SQL.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"sqlite"`\>

#### query

`any`

## Returns

`any`[]

## Example

```ts
const query = lix.db.selectFrom("key_value").selectAll();
  const result = executeSync({ lix, query }) as KeyValue[];
```

---

## fileQueueSettled

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / fileQueueSettled

# Function: fileQueueSettled()

> **fileQueueSettled**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/file-queue/file-queue-settled.ts:11](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/file-queue/file-queue-settled.ts#L11)

Waits until the file queue is settled.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

## Returns

`Promise`\<`void`\>

## Example

```ts
  await fileQueueSettled({ lix });
  ```

---

## isValidFilePath

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / isValidFilePath

# Function: isValidFilePath()

> **isValidFilePath**(`path`): `boolean`

Defined in: [packages/lix-sdk/src/file/validate-file-path.ts:53](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/file/validate-file-path.ts#L53)

## Parameters

### path

`string`

## Returns

`boolean`

---

## jsonArrayFrom

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / jsonArrayFrom

# Function: jsonArrayFrom()

> **jsonArrayFrom**\<`O`\>(`expr`): `RawBuilder`\<`Simplify`\<`O`\>[]\>

Defined in: node\_modules/.pnpm/kysely@0.27.4/node\_modules/kysely/dist/esm/helpers/sqlite.d.ts:58

A SQLite helper for aggregating a subquery into a JSON array.

NOTE: This helper only works correctly if you've installed the `ParseJSONResultsPlugin`.
Otherwise the nested selections will be returned as JSON strings.

The plugin can be installed like this:

```ts
const db = new Kysely({
  dialect: new SqliteDialect(config),
  plugins: [new ParseJSONResultsPlugin()]
})
```

### Examples

```ts
const result = await db
  .selectFrom('person')
  .select((eb) => [
    'id',
    jsonArrayFrom(
      eb.selectFrom('pet')
        .select(['pet.id as pet_id', 'pet.name'])
        .whereRef('pet.owner_id', '=', 'person.id')
        .orderBy('pet.name')
    ).as('pets')
  ])
  .execute()

result[0].id
result[0].pets[0].pet_id
result[0].pets[0].name
```

The generated SQL (SQLite):

```sql
select "id", (
  select coalesce(json_group_array(json_object(
    'pet_id', "agg"."pet_id",
    'name', "agg"."name"
  )), '[]') from (
    select "pet"."id" as "pet_id", "pet"."name"
    from "pet"
    where "pet"."owner_id" = "person"."id"
    order by "pet"."name"
  ) as "agg"
) as "pets"
from "person"
```

## Type Parameters

### O

`O`

## Parameters

### expr

`SelectQueryBuilderExpression`\<`O`\>

## Returns

`RawBuilder`\<`Simplify`\<`O`\>[]\>

---

## jsonObjectFrom

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / jsonObjectFrom

# Function: jsonObjectFrom()

> **jsonObjectFrom**\<`O`\>(`expr`): `RawBuilder`\<`null` \| `Simplify`\<`O`\>\>

Defined in: node\_modules/.pnpm/kysely@0.27.4/node\_modules/kysely/dist/esm/helpers/sqlite.d.ts:114

A SQLite helper for turning a subquery into a JSON object.

The subquery must only return one row.

NOTE: This helper only works correctly if you've installed the `ParseJSONResultsPlugin`.
Otherwise the nested selections will be returned as JSON strings.

The plugin can be installed like this:

```ts
const db = new Kysely({
  dialect: new SqliteDialect(config),
  plugins: [new ParseJSONResultsPlugin()]
})
```

### Examples

```ts
const result = await db
  .selectFrom('person')
  .select((eb) => [
    'id',
    jsonObjectFrom(
      eb.selectFrom('pet')
        .select(['pet.id as pet_id', 'pet.name'])
        .whereRef('pet.owner_id', '=', 'person.id')
        .where('pet.is_favorite', '=', true)
    ).as('favorite_pet')
  ])
  .execute()

result[0].id
result[0].favorite_pet.pet_id
result[0].favorite_pet.name
```

The generated SQL (SQLite):

```sql
select "id", (
  select json_object(
    'pet_id', "obj"."pet_id",
    'name', "obj"."name"
  ) from (
    select "pet"."id" as "pet_id", "pet"."name"
    from "pet"
    where "pet"."owner_id" = "person"."id"
    and "pet"."is_favorite" = ?
  ) as obj
) as "favorite_pet"
from "person";
```

## Type Parameters

### O

`O`

## Parameters

### expr

`SelectQueryBuilderExpression`\<`O`\>

## Returns

`RawBuilder`\<`null` \| `Simplify`\<`O`\>\>

---

## mergeVersion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / mergeVersion

# Function: mergeVersion()

> **mergeVersion**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/version/merge-version.ts:8](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/version/merge-version.ts#L8)

## Parameters

### args

#### lix

[`Lix`](../type-aliases/Lix.md)

#### sourceVersion

\{ `id`: `string`; `name`: `string`; \}

#### sourceVersion.id

`string`

#### sourceVersion.name

`string`

#### targetVersion

\{ `id`: `string`; `name`: `string`; \}

#### targetVersion.id

`string`

#### targetVersion.name

`string`

## Returns

`Promise`\<`void`\>

---

## mockJsonSnapshot

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / mockJsonSnapshot

# Function: mockJsonSnapshot()

> **mockJsonSnapshot**(`content`): `object`

Defined in: [packages/lix-sdk/src/snapshot/mock-json-snapshot.ts:9](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/snapshot/mock-json-snapshot.ts#L9)

Util function for tests that creates a snapshot that looks like one you got returned from the database after inserting

## Parameters

### content

`Record`\<`string`, `any`\>

## Returns

`object`

### content

> **content**: `null` \| `Record`\<`string`, `any`\>

### id

> **id**: `string`

---

## newLixFile

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / newLixFile

# Function: newLixFile()

> **newLixFile**(): `Promise`\<`Blob`\>

Defined in: [packages/lix-sdk/src/lix/new-lix.ts:14](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/lix/new-lix.ts#L14)

Creates a new lix file.

The app is responsible for saving the project "whereever"
e.g. the user's computer, cloud storage, or OPFS in the browser.

## Returns

`Promise`\<`Blob`\>

---

## openLix

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / openLix

# Function: openLix()

> **openLix**(`args`): `Promise`\<[`Lix`](../type-aliases/Lix.md)\>

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:34](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/lix/open-lix.ts#L34)

Common setup between different lix environments.

## Parameters

### args

#### account?

\{ `id`: `string`; `name`: `string`; \}

The account that is opening this lix.

Lix will automatically set the active account to the provided account.

**Example**

```ts
const account = localStorage.getItem("account")
  const lix = await openLix({ account })
```

#### account.id

`string`

#### account.name

`string`

#### database

`SqliteWasmDatabase`

#### keyValues?

`object` & `object`[]

Set the key values when opening the lix.

**Example**

```ts
const lix = await openLix({ keyValues: [{ key: "lix_sync", value: "false" }] })
```

#### providePlugins?

[`LixPlugin`](../type-aliases/LixPlugin.md)[]

Usecase are lix apps that define their own file format,
like inlang (unlike a markdown, csv, or json plugin).

(+) avoids separating app code from plugin code and
    resulting bundling logic.

(-) such a file format must always be opened with the
    file format sdk. the file is not portable

**Example**

```ts
const lix = await openLixInMemory({ providePlugins: [myPlugin] })
```

## Returns

`Promise`\<[`Lix`](../type-aliases/Lix.md)\>

---

## openLixInMemory

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / openLixInMemory

# Function: openLixInMemory()

> **openLixInMemory**(`args`): `Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

Defined in: [packages/lix-sdk/src/lix/open-lix-in-memory.ts:8](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/lix/open-lix-in-memory.ts#L8)

Opens a lix in memory.

## Parameters

### args

`object` & `Omit`\<\{ `account`: \{ `id`: `string`; `name`: `string`; \}; `database`: `SqliteWasmDatabase`; `keyValues`: `object` & `object`[]; `providePlugins`: [`LixPlugin`](../type-aliases/LixPlugin.md)[]; \}, `"database"`\>

## Returns

`Promise`\<`Promise`\<[`Lix`](../type-aliases/Lix.md)\>\>

---

## resolveChangeConflictBySelecting

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / resolveChangeConflictBySelecting

# Function: resolveChangeConflictBySelecting()

> **resolveChangeConflictBySelecting**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/change-conflict/resolve-conflict-by-selecting.ts:10](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/change-conflict/resolve-conflict-by-selecting.ts#L10)

Resolves a conflict by selecting one of the two
changes in the conflict.

## Parameters

### args

#### conflict

\{ `change_set_id`: `string`; `id`: `string`; `key`: `string`; \}

#### conflict.change_set_id

`string`

#### conflict.id

`string`

#### conflict.key

`string`

#### lix

[`Lix`](../type-aliases/Lix.md)

#### select

\{ `created_at`: `string`; `entity_id`: `string`; `file_id`: `string`; `id`: `string`; `plugin_key`: `string`; `schema_key`: `string`; `snapshot_id`: `string`; \}

#### select.created_at

`string`

#### select.entity_id

`string`

#### select.file_id

`string`

#### select.id

`string`

#### select.plugin_key

`string`

#### select.schema_key

`string`

#### select.snapshot_id

`string`

## Returns

`Promise`\<`void`\>

---

## switchAccount

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / switchAccount

# Function: switchAccount()

> **switchAccount**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/account/switch-account.ts:23](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/switch-account.ts#L23)

Switch the current account to the provided account.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### to

`object`[]

## Returns

`Promise`\<`void`\>

## Examples

One active account

  ```ts
  await switchAccount({ lix, to: [otherAccount] });
  ```

Multiple active accounts

  ```ts
  await switchAccount({ lix, to: [account1, account2] });
  ```

---

## switchVersion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / switchVersion

# Function: switchVersion()

> **switchVersion**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/version/switch-version.ts:27](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/version/switch-version.ts#L27)

Switches the current Version to the given Version.

The Version must already exist before calling this function.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"` \| `"plugin"`\>

#### to

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

## Returns

`Promise`\<`void`\>

## Examples

```ts
  await switchVersion({ lix, to: otherVersion });
  ```

Switching Versiones to a newly created Version.

  ```ts
  await lix.db.transaction().execute(async (trx) => {
     const newVersion = await createVersion({ lix: { db: trx }, parent: currentVersion });
     await switchVersion({ lix: { db: trx }, to: newVersion });
  });
  ```

---

## toBlob

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / toBlob

# Function: toBlob()

> **toBlob**(`args`): `Promise`\<`Blob`\>

Defined in: [packages/lix-sdk/src/lix/to-blob.ts:10](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/lix/to-blob.ts#L10)

Convert the lix to a blob.

## Parameters

### args

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"` \| `"sqlite"`\>

## Returns

`Promise`\<`Blob`\>

## Example

```ts
const blob = await toBlob({ lix })
```

---

## updateChangesInVersion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / updateChangesInVersion

# Function: updateChangesInVersion()

> **updateChangesInVersion**(`args`): `Promise`\<`void`\>

Defined in: [packages/lix-sdk/src/version/update-changes-in-version.ts:10](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/version/update-changes-in-version.ts#L10)

Updates the changes that are part of a version.

This function will update the change_set_element table to point to the new changes.

## Parameters

### args

#### changes

`object`[]

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"` \| `"sqlite"`\>

#### version

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>

## Returns

`Promise`\<`void`\>

---

## validateFilePath

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / validateFilePath

# Function: validateFilePath()

> **validateFilePath**(`path`): `void`

Defined in: [packages/lix-sdk/src/file/validate-file-path.ts:12](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/file/validate-file-path.ts#L12)

Validates a file path.

## Parameters

### path

`string`

## Returns

`void`

## Throws

If the file path is invalid.

---

## withSkipOwnChangeControl

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / withSkipOwnChangeControl

# Function: withSkipOwnChangeControl()

> **withSkipOwnChangeControl**\<`T`\>(`db`, `operation`): `Promise`\<`T`\>

Defined in: [packages/lix-sdk/src/own-change-control/with-skip-own-change-control.ts:3](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/own-change-control/with-skip-own-change-control.ts#L3)

## Type Parameters

### T

`T`

## Parameters

### db

`Kysely`\<[`LixDatabaseSchema`](../type-aliases/LixDatabaseSchema.md)\>

### operation

(`trx`) => `Promise`\<`T`\>

## Returns

`Promise`\<`T`\>

---

## Account

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / Account

# Type Alias: Account

> **Account** = `Selectable`\<[`AccountTable`](AccountTable.md)\>

Defined in: [packages/lix-sdk/src/account/database-schema.ts:40](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L40)

---

## AccountTable

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / AccountTable

# Type Alias: AccountTable

> **AccountTable** = `object`

Defined in: [packages/lix-sdk/src/account/database-schema.ts:43](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L43)

## Properties

### id

> **id**: `Generated`\<`string`\>

Defined in: [packages/lix-sdk/src/account/database-schema.ts:44](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L44)

***

### name

> **name**: `string`

Defined in: [packages/lix-sdk/src/account/database-schema.ts:45](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L45)

---

## AccountUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / AccountUpdate

# Type Alias: AccountUpdate

> **AccountUpdate** = `Updateable`\<[`AccountTable`](AccountTable.md)\>

Defined in: [packages/lix-sdk/src/account/database-schema.ts:42](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L42)

---

## ActiveAccount

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ActiveAccount

# Type Alias: ActiveAccount

> **ActiveAccount** = `Selectable`\<[`ActiveAccountTable`](ActiveAccountTable.md)\>

Defined in: [packages/lix-sdk/src/account/database-schema.ts:48](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L48)

---

## ActiveAccountTable

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ActiveAccountTable

# Type Alias: ActiveAccountTable

> **ActiveAccountTable** = `object`

Defined in: [packages/lix-sdk/src/account/database-schema.ts:51](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L51)

## Properties

### id

> **id**: `string`

Defined in: [packages/lix-sdk/src/account/database-schema.ts:52](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L52)

***

### name

> **name**: `string`

Defined in: [packages/lix-sdk/src/account/database-schema.ts:53](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L53)

---

## ActiveAccountUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ActiveAccountUpdate

# Type Alias: ActiveAccountUpdate

> **ActiveAccountUpdate** = `Updateable`\<[`ActiveAccountTable`](ActiveAccountTable.md)\>

Defined in: [packages/lix-sdk/src/account/database-schema.ts:50](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L50)

---

## Change

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / Change

# Type Alias: Change

> **Change** = `Selectable`\<`ChangeTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:86](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L86)

---

## ChangeAuthor

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeAuthor

# Type Alias: ChangeAuthor

> **ChangeAuthor** = `Selectable`\<`ChangeAuthorTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:120](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L120)

---

## ChangeConflict

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeConflict

# Type Alias: ChangeConflict

> **ChangeConflict** = `Selectable`\<`ChangeConflictTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:245](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L245)

---

## ChangeConflictResolution

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeConflictResolution

# Type Alias: ChangeConflictResolution

> **ChangeConflictResolution** = `Selectable`\<`ChangeConflictResolutionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:264](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L264)

---

## ChangeConflictResolutionUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeConflictResolutionUpdate

# Type Alias: ChangeConflictResolutionUpdate

> **ChangeConflictResolutionUpdate** = `Updateable`\<`ChangeConflictResolutionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:268](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L268)

---

## ChangeConflictUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeConflictUpdate

# Type Alias: ChangeConflictUpdate

> **ChangeConflictUpdate** = `Updateable`\<`ChangeConflictTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:247](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L247)

---

## ChangeEdge

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeEdge

# Type Alias: ChangeEdge

> **ChangeEdge** = `Selectable`\<`ChangeEdgeTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:113](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L113)

---

## ChangeSet

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeSet

# Type Alias: ChangeSet

> **ChangeSet** = `Selectable`\<`ChangeSetTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:145](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L145)

---

## ChangeSetElement

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeSetElement

# Type Alias: ChangeSetElement

> **ChangeSetElement** = `Selectable`\<`ChangeSetElementTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:152](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L152)

---

## ChangeSetElementUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeSetElementUpdate

# Type Alias: ChangeSetElementUpdate

> **ChangeSetElementUpdate** = `Updateable`\<`ChangeSetElementTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:154](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L154)

---

## ChangeSetLabel

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeSetLabel

# Type Alias: ChangeSetLabel

> **ChangeSetLabel** = `Selectable`\<`ChangeSetLabelTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:190](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L190)

---

## ChangeSetLabelUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeSetLabelUpdate

# Type Alias: ChangeSetLabelUpdate

> **ChangeSetLabelUpdate** = `Updateable`\<`ChangeSetLabelTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:192](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L192)

---

## ChangeSetUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeSetUpdate

# Type Alias: ChangeSetUpdate

> **ChangeSetUpdate** = `Updateable`\<`ChangeSetTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:147](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L147)

---

## Comment

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / Comment

# Type Alias: Comment

> **Comment** = `Selectable`\<`CommentTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:170](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L170)

---

## CommentUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / CommentUpdate

# Type Alias: CommentUpdate

> **CommentUpdate** = `Updateable`\<`CommentTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:172](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L172)

---

## CurrentVersion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / CurrentVersion

# Type Alias: CurrentVersion

> **CurrentVersion** = `Selectable`\<`CurrentVersionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:228](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L228)

---

## CurrentVersionUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / CurrentVersionUpdate

# Type Alias: CurrentVersionUpdate

> **CurrentVersionUpdate** = `Updateable`\<`CurrentVersionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:230](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L230)

---

## DetectedChange

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / DetectedChange

# Type Alias: DetectedChange\<Schema\>

> **DetectedChange**\<`Schema`\> = `object`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:97](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L97)

A detected change that lix ingests in to the database.

- If the `snapshot` is `undefined`, the change is considered to be a deletion.
- The `schema` type can be narrowed by providing a change schema.

## Example

Type narrowing with a change schema:

  ```
	 const FooV1Schema = {
    key: "plugin-name-foo-v1",
    type: "json",
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
		   }
    }
  } as const satisfies ChangeSchema;

  const detectedChange: DetectedChange<typeof FooV1Schema>

  detectedChange.snapshot.name // string
  ```

## Type Parameters

### Schema

`Schema` *extends* [`ExperimentalChangeSchema`](ExperimentalChangeSchema.md) = `any`

## Properties

### entity\_id

> **entity\_id**: `string`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:98](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L98)

***

### schema

> **schema**: `Omit`\<[`ExperimentalChangeSchema`](ExperimentalChangeSchema.md), `"schema"`\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:99](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L99)

***

### snapshot?

> `optional` **snapshot**: [`ExperimentalInferType`](ExperimentalInferType.md)\<`Schema`\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:104](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L104)

The change is considered a deletion if `snapshot` is `undefined`.

---

## DetectedConflict

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / DetectedConflict

# Type Alias: DetectedConflict

> **DetectedConflict** = `object`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:107](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L107)

## Properties

### conflictingChangeIds

> **conflictingChangeIds**: `Set`\<[`Change`](Change.md)\[`"id"`\]\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:115](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L115)

The changes that are conflicting.

***

### key

> **key**: `string`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:111](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L111)

#### See

---

## Discussion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / Discussion

# Type Alias: Discussion

> **Discussion** = `Selectable`\<`DiscussionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:162](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L162)

---

## DiscussionUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / DiscussionUpdate

# Type Alias: DiscussionUpdate

> **DiscussionUpdate** = `Updateable`\<`DiscussionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:164](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L164)

---

## ExperimentalChangeSchema

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ExperimentalChangeSchema

# Type Alias: ExperimentalChangeSchema

> **ExperimentalChangeSchema** = \{ `key`: `string`; `schema`: `JSONSchema`; `type`: `"json"`; \} \| \{ `key`: `string`; `schema`: `undefined`; `type`: `"blob"`; \}

Defined in: [packages/lix-sdk/src/change-schema/types.ts:43](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/change-schema/types.ts#L43)

The schema of a detected change.

The key is used to identify the schema. It is highly
recommended to use a unique key for each schema and
include a version number in the key when breaking
changes are made.

- use `as const` to narrow the types
- use `... satisfies ChangeSchema` to get autocomplete

## Example

```ts
const FooV1 = {
     key: "csv-plugin-foo-v1",
     type: "json",
     schema: jsonSchema,
  } as const satisfies ChangeSchema;
```

---

## ExperimentalInferType

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ExperimentalInferType

# Type Alias: ExperimentalInferType\<ChangeSchema\>

> **ExperimentalInferType**\<`ChangeSchema`\> = `ChangeSchema` *extends* `object` ? `FromSchema`\<`ChangeSchema`\[`"schema"`\]\> : `ChangeSchema` *extends* `object` ? `any` : `ChangeSchema` *extends* `object` ? `ArrayBuffer` : `never`

Defined in: [packages/lix-sdk/src/change-schema/types.ts:6](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/change-schema/types.ts#L6)

Infers the snapshot content type from the schema.

## Type Parameters

### ChangeSchema

`ChangeSchema`

---

## FileQueueEntry

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / FileQueueEntry

# Type Alias: FileQueueEntry

> **FileQueueEntry** = `Selectable`\<`FileQueueTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:52](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L52)

---

## FileQueueEntryUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / FileQueueEntryUpdate

# Type Alias: FileQueueEntryUpdate

> **FileQueueEntryUpdate** = `Updateable`\<`FileQueueTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:54](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L54)

---

## KeyValue

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / KeyValue

# Type Alias: KeyValue

> **KeyValue** = `Selectable`\<[`KeyValueTable`](KeyValueTable.md)\>

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:27](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/key-value/database-schema.ts#L27)

---

## KeyValueTable

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / KeyValueTable

# Type Alias: KeyValueTable

> **KeyValueTable** = `object`

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:30](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/key-value/database-schema.ts#L30)

## Properties

### key

> **key**: `KeyValueKeys`

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:39](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/key-value/database-schema.ts#L39)

The key of the key-value pair.

Lix prefixes its keys with "lix-" to avoid conflicts with user-defined keys.

#### Example

```ts
"namespace-cool-key"
```

***

### skip\_change\_control

> **skip\_change\_control**: `Generated`\<`boolean`\>

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:59](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/key-value/database-schema.ts#L59)

If `true`, the key-value pair is not tracked with own change control.

Carefull (!) when querying the database. The return value will be `0` or `1`.
SQLite does not have a boolean select type https://www.sqlite.org/datatype3.html.

#### Default

```ts
false
```

***

### value

> **value**: `string`

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:50](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/key-value/database-schema.ts#L50)

The value of the key-value pair.

Must be a string. A JSON is a string too ;)

#### Example

```ts
"some value"
  "{ "foo": "bar" }"
```

---

## KeyValueUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / KeyValueUpdate

# Type Alias: KeyValueUpdate

> **KeyValueUpdate** = `Updateable`\<[`KeyValueTable`](KeyValueTable.md)\>

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:29](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/key-value/database-schema.ts#L29)

---

## Label

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / Label

# Type Alias: Label

> **Label** = `Selectable`\<`LabelTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:182](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L182)

---

## LabelUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LabelUpdate

# Type Alias: LabelUpdate

> **LabelUpdate** = `Updateable`\<`LabelTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:184](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L184)

---

## Lix

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / Lix

# Type Alias: Lix

> **Lix** = `object`

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:13](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/lix/open-lix.ts#L13)

## Properties

### db

> **db**: `Kysely`\<[`LixDatabaseSchema`](LixDatabaseSchema.md)\>

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:25](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/lix/open-lix.ts#L25)

***

### plugin

> **plugin**: `object`

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:26](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/lix/open-lix.ts#L26)

#### getAll()

> **getAll**: () => `Promise`\<[`LixPlugin`](LixPlugin.md)[]\>

##### Returns

`Promise`\<[`LixPlugin`](LixPlugin.md)[]\>

***

### sqlite

> **sqlite**: `SqliteWasmDatabase`

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:24](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/lix/open-lix.ts#L24)

The raw SQLite instance.

Required for advanced use cases that can't be
expressed with the db API.

Use with caution, automatic transformation of
results like parsing json (similar to the db API)
is not guaranteed.

---

## LixDatabaseSchema

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixDatabaseSchema

# Type Alias: LixDatabaseSchema

> **LixDatabaseSchema** = `object`

Defined in: [packages/lix-sdk/src/database/schema.ts:9](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L9)

## Properties

### account

> **account**: [`AccountTable`](AccountTable.md)

Defined in: [packages/lix-sdk/src/database/schema.ts:11](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L11)

***

### active\_account

> **active\_account**: [`ActiveAccountTable`](ActiveAccountTable.md)

Defined in: [packages/lix-sdk/src/database/schema.ts:12](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L12)

***

### change

> **change**: `ChangeTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:23](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L23)

***

### change\_author

> **change\_author**: `ChangeAuthorTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:25](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L25)

***

### change\_conflict

> **change\_conflict**: `ChangeConflictTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:46](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L46)

***

### change\_conflict\_resolution

> **change\_conflict\_resolution**: `ChangeConflictResolutionTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:47](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L47)

***

### change\_edge

> **change\_edge**: `ChangeEdgeTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:24](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L24)

***

### change\_set

> **change\_set**: `ChangeSetTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:28](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L28)

***

### change\_set\_element

> **change\_set\_element**: `ChangeSetElementTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:29](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L29)

***

### change\_set\_label

> **change\_set\_label**: `ChangeSetLabelTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:30](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L30)

***

### comment

> **comment**: `CommentTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:37](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L37)

***

### current\_version

> **current\_version**: `CurrentVersionTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:40](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L40)

***

### discussion

> **discussion**: `DiscussionTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:36](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L36)

***

### file

> **file**: `LixFileTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:19](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L19)

***

### file\_queue

> **file\_queue**: `FileQueueTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:20](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L20)

***

### key\_value

> **key\_value**: [`KeyValueTable`](KeyValueTable.md)

Defined in: [packages/lix-sdk/src/database/schema.ts:33](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L33)

***

### label

> **label**: `LabelTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:16](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L16)

***

### mutation\_log

> **mutation\_log**: `MutationLogTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:49](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L49)

***

### snapshot

> **snapshot**: `SnapshotTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:15](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L15)

***

### version

> **version**: `VersionTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:41](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L41)

***

### version\_change

> **version\_change**: `VersionChangeTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:42](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L42)

***

### version\_change\_conflict

> **version\_change\_conflict**: `VersionChangeConflictTable`

Defined in: [packages/lix-sdk/src/database/schema.ts:43](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L43)

---

## LixFile

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixFile

# Type Alias: LixFile

> **LixFile** = `Selectable`\<`LixFileTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:67](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L67)

---

## LixFileUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixFileUpdate

# Type Alias: LixFileUpdate

> **LixFileUpdate** = `Updateable`\<`LixFileTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:69](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L69)

---

## LixPlugin

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixPlugin

# Type Alias: LixPlugin

> **LixPlugin** = `object`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:9](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L9)

## Properties

### applyChanges()?

> `optional` **applyChanges**: (`args`) => `Promise`\<\{ `fileData`: [`LixFile`](LixFile.md)\[`"data"`\]; \}\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:45](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L45)

#### Parameters

##### args

###### changes

[`Change`](Change.md)[]

###### file

`Omit`\<[`LixFile`](LixFile.md), `"data"`\> & `object`

The file to which the changes should be applied.

The `file.data` might be undefined if the file does not
exist at the time of applying the changes. This can
happen when merging a version that created a new file
that did not exist in the target version. Or, a file
has been deleted and should be restored at a later point.

###### lix

[`LixReadonly`](LixReadonly.md)

#### Returns

`Promise`\<\{ `fileData`: [`LixFile`](LixFile.md)\[`"data"`\]; \}\>

***

### detectChanges()?

> `optional` **detectChanges**: (`args`) => `Promise`\<[`DetectedChange`](DetectedChange.md)[]\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:29](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L29)

Detects changes between the `before` and `after` file update(s).

`Before` is `undefined` if the file did not exist before (
the file was created).

`After` is always defined. Either the file was updated, or
deleted. If the file is deleted, lix own change control
will handle the deletion. Hence, `after` is always be defined.

#### Parameters

##### args

###### after

[`LixFile`](LixFile.md)

###### before?

[`LixFile`](LixFile.md)

###### lix

[`LixReadonly`](LixReadonly.md)

#### Returns

`Promise`\<[`DetectedChange`](DetectedChange.md)[]\>

***

### detectChangesGlob?

> `optional` **detectChangesGlob**: `string`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:18](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L18)

The glob pattern that should invoke `detectChanges()`.

#### Example

```ts
`**/*.json` for all JSON files
  `**/*.inlang` for all inlang files
```

***

### detectConflicts()?

> `optional` **detectConflicts**: (`args`) => `Promise`\<[`DetectedConflict`](DetectedConflict.md)[]\>

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:41](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L41)

Detects changes from the source lix that conflict with changes in the target lix.

#### Parameters

##### args

###### changes

[`Change`](Change.md)[]

###### lix

[`LixReadonly`](LixReadonly.md)

#### Returns

`Promise`\<[`DetectedConflict`](DetectedConflict.md)[]\>

***

### diffUiComponent?

> `optional` **diffUiComponent**: `CustomElementConstructor`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:37](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L37)

UI components that are used to render the diff view.

***

### key

> **key**: `string`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:10](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L10)

---

## LixReadonly

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixReadonly

# Type Alias: LixReadonly

> **LixReadonly** = `Pick`\<[`Lix`](Lix.md), `"plugin"`\> & `object`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:118](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L118)

## Type declaration

### db

> **db**: `object`

#### db.selectFrom

> **selectFrom**: [`Lix`](Lix.md)\[`"db"`\]\[`"selectFrom"`\]

#### db.withRecursive

> **withRecursive**: [`Lix`](Lix.md)\[`"db"`\]\[`"withRecursive"`\]

---

## LixServerProtocolHandlerContext

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixServerProtocolHandlerContext

# Type Alias: LixServerProtocolHandlerContext

> **LixServerProtocolHandlerContext** = `object`

Defined in: [packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts:9](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts#L9)

## Properties

### environment

> **environment**: `LspEnvironment`

Defined in: [packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts:11](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts#L11)

***

### params?

> `optional` **params**: `Record`\<`string`, `string` \| `undefined`\>

Defined in: [packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts:12](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts#L12)

***

### request

> **request**: `Request`

Defined in: [packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts:10](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts#L10)

---

## NewAccount

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewAccount

# Type Alias: NewAccount

> **NewAccount** = `Insertable`\<[`AccountTable`](AccountTable.md)\>

Defined in: [packages/lix-sdk/src/account/database-schema.ts:41](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L41)

---

## NewActiveAccount

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewActiveAccount

# Type Alias: NewActiveAccount

> **NewActiveAccount** = `Insertable`\<[`ActiveAccountTable`](ActiveAccountTable.md)\>

Defined in: [packages/lix-sdk/src/account/database-schema.ts:49](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/account/database-schema.ts#L49)

---

## NewChange

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewChange

# Type Alias: NewChange

> **NewChange** = `Insertable`\<`ChangeTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:87](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L87)

---

## NewChangeAuthor

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewChangeAuthor

# Type Alias: NewChangeAuthor

> **NewChangeAuthor** = `Insertable`\<`ChangeAuthorTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:121](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L121)

---

## NewChangeConflict

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewChangeConflict

# Type Alias: NewChangeConflict

> **NewChangeConflict** = `Insertable`\<`ChangeConflictTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:246](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L246)

---

## NewChangeConflictResolution

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewChangeConflictResolution

# Type Alias: NewChangeConflictResolution

> **NewChangeConflictResolution** = `Insertable`\<`ChangeConflictResolutionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:266](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L266)

---

## NewChangeEdge

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewChangeEdge

# Type Alias: NewChangeEdge

> **NewChangeEdge** = `Insertable`\<`ChangeEdgeTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:114](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L114)

---

## NewChangeSet

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewChangeSet

# Type Alias: NewChangeSet

> **NewChangeSet** = `Insertable`\<`ChangeSetTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:146](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L146)

---

## NewChangeSetElement

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewChangeSetElement

# Type Alias: NewChangeSetElement

> **NewChangeSetElement** = `Insertable`\<`ChangeSetElementTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:153](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L153)

---

## NewChangeSetLabel

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewChangeSetLabel

# Type Alias: NewChangeSetLabel

> **NewChangeSetLabel** = `Insertable`\<`ChangeSetLabelTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:191](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L191)

---

## NewComment

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewComment

# Type Alias: NewComment

> **NewComment** = `Insertable`\<`CommentTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:171](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L171)

---

## NewCurrentVersion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewCurrentVersion

# Type Alias: NewCurrentVersion

> **NewCurrentVersion** = `Insertable`\<`CurrentVersionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:229](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L229)

---

## NewDiscussion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewDiscussion

# Type Alias: NewDiscussion

> **NewDiscussion** = `Insertable`\<`DiscussionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:163](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L163)

---

## NewFileQueueEntry

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewFileQueueEntry

# Type Alias: NewFileQueueEntry

> **NewFileQueueEntry** = `Insertable`\<`FileQueueTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:53](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L53)

---

## NewKeyValue

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewKeyValue

# Type Alias: NewKeyValue

> **NewKeyValue** = `Insertable`\<[`KeyValueTable`](KeyValueTable.md)\>

Defined in: [packages/lix-sdk/src/key-value/database-schema.ts:28](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/key-value/database-schema.ts#L28)

---

## NewLabel

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewLabel

# Type Alias: NewLabel

> **NewLabel** = `Insertable`\<`LabelTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:183](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L183)

---

## NewLixFile

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewLixFile

# Type Alias: NewLixFile

> **NewLixFile** = `Insertable`\<`LixFileTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:68](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L68)

---

## NewSnapshot

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewSnapshot

# Type Alias: NewSnapshot

> **NewSnapshot** = `Insertable`\<`SnapshotTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:128](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L128)

---

## NewVersionChange

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewVersionChange

# Type Alias: NewVersionChange

> **NewVersionChange** = `Insertable`\<`VersionChangeTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:209](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L209)

---

## Newversion

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / Newversion

# Type Alias: Newversion

> **Newversion** = `Insertable`\<`VersionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:201](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L201)

---

## NewversionChangeConflict

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / NewversionChangeConflict

# Type Alias: NewversionChangeConflict

> **NewversionChangeConflict** = `Insertable`\<`VersionChangeConflictTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:220](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L220)

---

## Snapshot

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / Snapshot

# Type Alias: Snapshot

> **Snapshot** = `Selectable`\<`SnapshotTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:127](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L127)

---

## UiDiffComponentProps

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / UiDiffComponentProps

# Type Alias: UiDiffComponentProps

> **UiDiffComponentProps** = `object`

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:125](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L125)

## Properties

### diffs

> **diffs**: `Pick`\<[`Change`](Change.md), `"entity_id"` \| `"plugin_key"` \| `"schema_key"`\> & `object`[]

Defined in: [packages/lix-sdk/src/plugin/lix-plugin.ts:126](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/plugin/lix-plugin.ts#L126)

---

## Version

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / Version

# Type Alias: Version

> **Version** = `Selectable`\<`VersionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:200](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L200)

---

## VersionChange

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / VersionChange

# Type Alias: VersionChange

> **VersionChange** = `Selectable`\<`VersionChangeTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:208](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L208)

---

## VersionChangeConflict

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / VersionChangeConflict

# Type Alias: VersionChangeConflict

> **VersionChangeConflict** = `Selectable`\<`VersionChangeConflictTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:219](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L219)

---

## VersionChangeConflictUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / VersionChangeConflictUpdate

# Type Alias: VersionChangeConflictUpdate

> **VersionChangeConflictUpdate** = `Updateable`\<`VersionChangeConflictTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:221](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L221)

---

## VersionChangeUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / VersionChangeUpdate

# Type Alias: VersionChangeUpdate

> **VersionChangeUpdate** = `Updateable`\<`VersionChangeTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:210](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L210)

---

## VersionUpdate

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / VersionUpdate

# Type Alias: VersionUpdate

> **VersionUpdate** = `Updateable`\<`VersionTable`\>

Defined in: [packages/lix-sdk/src/database/schema.ts:202](https://github.com/opral/monorepo/blob/c13f0c918d257762bc7c6d37d45e4c6bded6e939/packages/lix-sdk/src/database/schema.ts#L202)

---

## sql

[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / sql

# Variable: sql

> `const` **sql**: `Sql`

Defined in: node\_modules/.pnpm/kysely@0.27.4/node\_modules/kysely/dist/esm/raw-builder/sql.d.ts:347

---

