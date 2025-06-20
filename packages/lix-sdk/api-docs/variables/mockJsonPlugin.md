[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / mockJsonPlugin

# Variable: mockJsonPlugin

> `const` **mockJsonPlugin**: [`LixPlugin`](../type-aliases/LixPlugin.md)

Defined in: [packages/lix-sdk/src/plugin/mock-json-plugin.ts:28](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/plugin/mock-json-plugin.ts#L28)

A mock plugin that handles JSON data.

Use this mock plugin for testing purposes. Do not
use this plugin in production! It may change at
any time.

## Example

```ts
const lix = await openLixInMemory({
    providePlugins: [mockJsonPlugin],
  });
```
