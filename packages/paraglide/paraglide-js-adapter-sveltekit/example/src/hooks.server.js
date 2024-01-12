import { handle as _handle } from "@inlang/paraglide-js-adapter-sveltekit"
import { sequence } from "@sveltejs/kit/hooks"

export const handle = sequence(_handle({ langPlaceholder: "%lang%" }))
