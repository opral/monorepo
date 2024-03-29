export const setExportparts = (context: HTMLElement) => {
	// @ts-ignore
	const nodeList = context.shadowRoot.querySelectorAll("[part]")
	// @ts-ignore
	console.log(context.shadowRoot.querySelectorAll("[exportparts]"))
	const allParts = [
		...new Set(
			// @ts-ignore
			[...nodeList].map(
				(element) =>
					element.getAttribute("part") +
					":" +
					// @ts-ignore
					context.tagName.toLowerCase() +
					"__" +
					element.getAttribute("part")
			)
		),
	].filter(Boolean)

	console.log(allParts.length > 0 ? context.tagName : "")
	context.setAttribute("exportparts", allParts.join(" "))
	context.setAttribute("part", context.tagName.toLowerCase())
}
