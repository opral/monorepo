# Lix Server Protocol Handler

Embed the lix server protocol in your own application.

- works in any JS runtime (node, browser, deno) 
- no UI, bells or whistles, just handling the lix server protocol

## Usage

```ts
import { createLspHandler } from '@lix-js/sdk';

// or any other server framework (express, koa, hono, etc.)
const app = new Hono();

const lsp = createLspHandler({
  // options
});

// add the handler to your app
// the handler will handle all requests to /lsp/*
app.use('/lsp/*', (req) => {
  // depending on your server framework, 
  // the request and response need to be mapped
  const response = await lsp(request);
  return response;
});
```
