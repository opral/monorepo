import type { InlangFunction } from "@inlang/sdk-js/runtime"

export const serverFn = (i: InlangFunction) => console.info("utils/server.ts", i("welcome"))
