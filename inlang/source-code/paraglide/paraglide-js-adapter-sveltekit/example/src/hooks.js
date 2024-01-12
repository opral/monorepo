import { reroute as reroute_ } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "$paraglide/runtime.js"
import { pathTranslations } from "$lib/i18n"

/** @type {import("@sveltejs/kit").Reroute} */
export const reroute = reroute_(runtime, pathTranslations)
