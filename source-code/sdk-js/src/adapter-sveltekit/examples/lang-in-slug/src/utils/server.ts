import type { LookupFunction } from "@inlang/sdk-js/runtime"

export const serverFn = (i: LookupFunction) => console.info("utils/server.ts", i("welcome"))
