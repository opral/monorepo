import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types.js"
import { languages } from "../../../inlang.server.js"

export const GET = (() => json(languages)) satisfies RequestHandler
