[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / ChangeSetTable

# Type Alias: ChangeSetTable

> **ChangeSetTable** = `object`

Defined in: [packages/lix-sdk/src/change-set/database-schema.ts:96](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/change-set/database-schema.ts#L96)

## Properties

### id

> **id**: `Generated`\<`string`\>

Defined in: [packages/lix-sdk/src/change-set/database-schema.ts:97](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/change-set/database-schema.ts#L97)

***

### immutable\_elements

> **immutable\_elements**: `Generated`\<`boolean`\>

Defined in: [packages/lix-sdk/src/change-set/database-schema.ts:102](https://github.com/opral/monorepo/blob/bc82d6c7272aa8ad8661dcf0fee644d9229ef5eb/packages/lix-sdk/src/change-set/database-schema.ts#L102)

Carefull (!) when querying the database. The return value will be `0` or `1`.
SQLite does not have a boolean select type https://www.sqlite.org/datatype3.html.
