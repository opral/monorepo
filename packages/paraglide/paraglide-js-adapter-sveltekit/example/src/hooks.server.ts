import { handleRedirects, injectLangAttribute } from "@inlang/paraglide-js-adapter-sveltekit"
import { sequence } from "@sveltejs/kit/hooks"
export const handle = sequence(injectLangAttribute("%lang%"), handleRedirects)
