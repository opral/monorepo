import { handle as _handle, handleRedirects } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "$paraglide/runtime.js"
import { sequence } from "@sveltejs/kit/hooks"
import { pathTranslations } from "$lib/i18n"

export const handle = sequence(
	_handle({ langPlaceholder: "%lang%" }),
	handleRedirects(runtime, pathTranslations)
)
