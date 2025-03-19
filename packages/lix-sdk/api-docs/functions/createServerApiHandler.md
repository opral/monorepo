[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../globals.md) / createServerApiHandler

# Function: createServerApiHandler()

> **createServerApiHandler**(`args`): `Promise`\<`LixServerApiHandler`\>

Defined in: [packages/lix-sdk/src/server-api-handler/create-server-api-handler.ts:55](https://github.com/opral/monorepo/blob/e988989a407211f6aa9551fb06720fedf7059729/packages/lix-sdk/src/server-api-handler/create-server-api-handler.ts#L55)

The handler for the lix server protocol.

## Parameters

### args

#### environment

`LsaEnvironment`

## Returns

`Promise`\<`LixServerApiHandler`\>

## Examples

Usage with a server framework.

  ```ts
	 // any server framework goes
  // here, like express, polka, etc.
  // frameworks that do not use
  // web standard Request and Response
  // objects will need to be mapped.
  const app = new Hono();

  const lsaHandler = createServerApiHandler({ storage });

  app.use('/lsp/*', async (req) => {
     await lsaHandler(req);
  });
  ```

Testing the handler.

  ```ts
  const lsaHandler = createServerApiHandler({ storage });
  const request = new Request('/lsp/new', {
    method: 'POST',
    body: new Blob(['...']),
  });

  const response = await lsaHandler(request);

  expect(response).to(...);
  ```
