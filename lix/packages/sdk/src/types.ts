import type { openLix } from "./open/openLix.js"

export type Lix = Awaited<ReturnType<typeof openLix>>
