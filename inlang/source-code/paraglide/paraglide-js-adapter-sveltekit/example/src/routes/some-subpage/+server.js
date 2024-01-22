import { base } from "$app/paths"
import { i18n } from "$lib/i18n"
import { redirect } from "@sveltejs/kit"

export const prerender = true

export function GET() {
	redirect(303, i18n.route(base + "/about", "fr"))
}
