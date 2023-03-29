import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types.js"
import { getResource } from "../../../inlang.server.js"

// eslint-disable-next-line unicorn/no-null
export const GET = (({ params: { language } }) =>
	json(getResource(language) || null)) satisfies RequestHandler
