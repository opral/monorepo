import { getRuntimeFromGlobalThis } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared"

export const test = () => console.info(1111, getRuntimeFromGlobalThis().i("welcome"))
