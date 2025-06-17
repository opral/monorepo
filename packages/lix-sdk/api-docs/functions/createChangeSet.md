[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createChangeSet

# Function: createChangeSet()

> **createChangeSet**(`args`): `Promise`\<\{ `id`: `string`; `immutable_elements`: `boolean`; \}\>

Defined in: [packages/lix-sdk/src/change-set/create-change-set.ts:36](https://github.com/opral/monorepo/blob/985ffce1eb6542fd7d2a659b02ab83cb2ccd8d57/packages/lix-sdk/src/change-set/create-change-set.ts#L36)

Creates a change set with the given elements, optionally within an open transaction.

## Parameters

### args

#### elements?

`Pick`\<[`ChangeSetElementTable`](../type-aliases/ChangeSetElementTable.md), `"entity_id"` \| `"file_id"` \| `"schema_key"` \| `"change_id"`\>[]

#### id?

`string`

#### immutableElements?

`boolean`

If true, all elements of the change set will be immutable after creation.

Immutable change set elements is required to create change set edges (the graph).

WARNING: The SQL schema defaults to false to allow crating change sets
and inserting elements. For ease of use, the `createChangeSet()` utility
defaults to true because in the majority of cases change set elements should be immutable.

**Default**

```ts
true
```

#### labels?

`Pick`\<\{ `id`: `string`; `name`: `string`; \}, `"id"`\>[]

#### lix

`Pick`\<[`Lix`](../type-aliases/Lix.md), `"db"`\>

#### parents?

`Pick`\<\{ `id`: `string`; `immutable_elements`: `boolean`; \}, `"id"`\>[]

Parent change sets that this change set will be a child of

## Returns

`Promise`\<\{ `id`: `string`; `immutable_elements`: `boolean`; \}\>

## Examples

```ts
  const elements = await lix.db.selectFrom("change_set_element").selectAll().execute();
  const changeSet = await createChangeSet({ db: lix.db, elements });
  ```

```ts
  // Create a change set with labels
  const labels = await lix.db.selectFrom("label").selectAll().execute();
  const changeSet = await createChangeSet({
    lix,
    elements: [],
    labels
  });
  ```

```ts
  // Create a change set with parent change sets
  const parentChangeSet = await createChangeSet({ lix, elements: [] });
  const childChangeSet = await createChangeSet({
    lix,
    elements: [],
    parents: [parentChangeSet]
  });
  ```
