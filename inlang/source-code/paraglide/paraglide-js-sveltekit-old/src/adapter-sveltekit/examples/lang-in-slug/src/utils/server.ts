import type { InlangFunction } from "@inlang/paraglide-js-sveltekit/runtime"

export const serverFn = (i: InlangFunction) => console.info("utils/server.ts", i("welcome"))
