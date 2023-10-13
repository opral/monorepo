import type { PageContext } from "#src/renderer/types.js"
import { redirect } from "vite-plugin-ssr/abort"

export async function onBeforeRender(pageContext: PageContext) {
	const { id } = pageContext.routeParams

	throw redirect(`/m/${id}`)
}
