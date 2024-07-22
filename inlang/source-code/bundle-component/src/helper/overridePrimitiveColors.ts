import chroma from "chroma-js"

const overridePrimitiveColors = () => {
	const inlangMessageBundle = document.querySelector("inlang-message-bundle")
	if (!inlangMessageBundle) return undefined

	const primitives = ["primary", "success", "warning", "danger", "neutral"]

	for (const primitive of primitives) {
		const unformattedColor = window
			.getComputedStyle(inlangMessageBundle)
			.getPropertyValue(`--inlang-color-${primitive}`)
			.trim()

		if (unformattedColor !== "") {
			const colorShades = getPalette(unformattedColor)
			appendCSSProperties(colorShades, primitive, inlangMessageBundle)
		}
	}
}

const appendCSSProperties = (
	colorShades: Record<number, string>,
	primitive: string,
	element: HTMLElement
) => {
	let textContent = Object.entries(colorShades)
		.map(([index, shade]) => `--sl-color-${primitive}-${index}: ${shade} !important;`)
		.join("\n")

	textContent = ":host { " + textContent + " }"

	const shadowRoot = element.shadowRoot || element.attachShadow({ mode: "open" })

	const style = document.createElement("style")
	style.textContent = textContent
	shadowRoot.appendChild(style)
}

export const getColor = (unformattedColor: string) => chroma(unformattedColor)

export const getPalette = (unformattedColor: string) => {
	const color = getColor(unformattedColor)
	const colors = chroma.scale(["white", color, "black"]).domain([0, 0.6, 1]).mode("lrgb")
	const palette: Record<number, string> = {}

	// Create 50
	palette[50] = colors(0.05).hex()

	// Create 100-900
	for (let i = 0.1; i < 0.9; i += 0.1) {
		palette[Math.round(i * 1000)] = colors(i).hex()
	}
	// Create 950
	palette[950] = colors(0.95).hex()
	return palette
}

export default overridePrimitiveColors
