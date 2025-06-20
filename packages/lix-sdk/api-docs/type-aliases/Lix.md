[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / Lix

# Type Alias: Lix

> **Lix** = `object`

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:12](https://github.com/opral/monorepo/blob/3bcc1f95be292671fbdc30a84e807512030f233b/packages/lix-sdk/src/lix/open-lix.ts#L12)

## Properties

### db

> **db**: `Kysely`\<[`LixDatabaseSchema`](LixDatabaseSchema.md)\>

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:24](https://github.com/opral/monorepo/blob/3bcc1f95be292671fbdc30a84e807512030f233b/packages/lix-sdk/src/lix/open-lix.ts#L24)

***

### plugin

> **plugin**: `object`

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:25](https://github.com/opral/monorepo/blob/3bcc1f95be292671fbdc30a84e807512030f233b/packages/lix-sdk/src/lix/open-lix.ts#L25)

#### getAll()

> **getAll**: () => `Promise`\<[`LixPlugin`](LixPlugin.md)[]\>

##### Returns

`Promise`\<[`LixPlugin`](LixPlugin.md)[]\>

#### getAllSync()

> **getAllSync**: () => [`LixPlugin`](LixPlugin.md)[]

##### Returns

[`LixPlugin`](LixPlugin.md)[]

***

### sqlite

> **sqlite**: `SqliteWasmDatabase`

Defined in: [packages/lix-sdk/src/lix/open-lix.ts:23](https://github.com/opral/monorepo/blob/3bcc1f95be292671fbdc30a84e807512030f233b/packages/lix-sdk/src/lix/open-lix.ts#L23)

The raw SQLite instance.

Required for advanced use cases that can't be
expressed with the db API.

Use with caution, automatic transformation of
results like parsing json (similar to the db API)
is not guaranteed.
