import { LitElement } from "lit"

export class BaseElement extends LitElement {
	// @ts-ignore
	protected createRenderRoot(): Element | ShadowRoot {
		// inject the global styles
		const root = this.attachShadow({ mode: "open" })
		const link = document.createElement("link")
		link.rel = "stylesheet"
		link.href = "/src/style.css"
		// inject tailwind css global styles
		root.appendChild(link)
		return root
	}
}
