Remote Procedure Calls (RPC) that can be used throughout the codebase.

The function defined in [./src](./src) are run on the server.

## Server

Run the standalone RPC server:

```bash
pnpm --filter @inlang/rpc build
pnpm --filter @inlang/rpc start
```

Environment:

- `PORT` (default: `8787`)
- `HOST` (default: `0.0.0.0`)
