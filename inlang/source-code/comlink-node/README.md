# Comlink Node

Internal utility package for building isomorphic NodeJS & web workers with Comlink.

## Usage

```typescript
// host.js
import { WorkerPrototype, adapter } from "comlink-node"
import * as Comlink from "comlink"

const worker = new WorkerPrototype(new URL("./worker.js", import.meta.url))
Comlink.expose(adapter(worker))
```

```typescript
// worker.js
import { endpoint } from "comlink-node"
import * as Comlink from "comlink"

const obj = {};
Comlink.expose(obj, endpoint)
```