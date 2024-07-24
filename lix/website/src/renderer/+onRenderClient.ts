import "@lit-labs/ssr-client/lit-element-hydrate-support.js"
import { kebabCasePageId } from "./kebabCasePageId.ts"

export async function onRenderClient(pageContext) {
	const pageId = kebabCasePageId(pageContext._pageId)
	if (customElements.get(pageId) === undefined) {
		customElements.define(pageId, pageContext.Page)
	}
}
