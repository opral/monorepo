The server middleware for all services in `@inlang/core/shared`.

Import the server middleware in the main server that is running.

```ts
import { router as inlangSharedServicesRouter } from "@inlang/shared/server"

const app = express()

app.use(inlangSharedServicesRouter)
```
