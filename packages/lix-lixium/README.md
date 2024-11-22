# Lixium

## What is Lixium?

Headless lix server protocol handler. 

- embed the lix server protocol in your own application
- works in any JS runtime (node, browser, deno) 
- no UI, bells or whistles, just handling the lix server protocol

## Usage

```ts
import { createHandler } from '@lix-js/lixium';

// or any other server framework (express, koa, hono, etc.)
const app = express();

const lsp = createHandler({
  // options
});

// add the handler to your app
// the handler will handle all requests to /lsp/*
app.use('/lsp/*', (req, res) => {
  // depending on your server framework, 
  // the request and response need to be mapped
  return lsp(req, res);
});
```
