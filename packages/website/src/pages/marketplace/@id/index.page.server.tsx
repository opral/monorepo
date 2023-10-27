import type { PageContext } from "#src/renderer/types.js"
import { redirect } from "vike/abort"

export async function onBeforeRender(pageContext: PageContext) {
	const { id } = pageContext.routeParams

	throw redirect(`/m/${id}`)
}
