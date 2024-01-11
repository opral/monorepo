import { reroute as reroute_ } from "@inlang/paraglide-js-adapter-sveltekit"
import { pathTranslations } from "$lib/i18n"

/** @type {import("@sveltejs/kit").Reroute} */
export const reroute = reroute_(pathTranslations)
