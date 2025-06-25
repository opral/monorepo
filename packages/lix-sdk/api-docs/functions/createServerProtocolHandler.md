[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / createServerProtocolHandler

# Function: createServerProtocolHandler()

> **createServerProtocolHandler**(`args`): `Promise`\<`LixServerProtocolHandler`\>

Defined in: [packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts:55](https://github.com/opral/monorepo/blob/3025726c2bce8185b41ef0b1b2f7cc069ebcf2b0/packages/lix-sdk/src/server-protocol-handler/create-server-protocol-handler.ts#L55)

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
