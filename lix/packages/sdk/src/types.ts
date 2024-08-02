import type { setup } from "./open/setup.js"

export type Lix = Awaited<ReturnType<typeof setup>>
