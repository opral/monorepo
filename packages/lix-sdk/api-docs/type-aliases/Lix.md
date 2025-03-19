[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / Lix

# Type Alias: Lix

> **Lix** = `object`

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:13](https://github.com/opral/monorepo/blob/cf4299047f63a84de437bf67ff42fca1baa00869/packages/lix-sdk/src/lix/open-lix.ts#L13)

## Properties

### db

> **db**: `Kysely`\<[`LixDatabaseSchema`](LixDatabaseSchema.md)\>

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:25](https://github.com/opral/monorepo/blob/cf4299047f63a84de437bf67ff42fca1baa00869/packages/lix-sdk/src/lix/open-lix.ts#L25)

***

### plugin

> **plugin**: `object`

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:26](https://github.com/opral/monorepo/blob/cf4299047f63a84de437bf67ff42fca1baa00869/packages/lix-sdk/src/lix/open-lix.ts#L26)

#### getAll()

> **getAll**: () => `Promise`\<[`LixPlugin`](LixPlugin.md)[]\>

##### Returns

`Promise`\<[`LixPlugin`](LixPlugin.md)[]\>

***

### sqlite

> **sqlite**: `SqliteWasmDatabase`

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:24](https://github.com/opral/monorepo/blob/cf4299047f63a84de437bf67ff42fca1baa00869/packages/lix-sdk/src/lix/open-lix.ts#L24)

The raw SQLite instance.

Required for advanced use cases that can't be
expressed with the db API.

Use with caution, automatic transformation of
results like parsing json (similar to the db API)
is not guaranteed.
