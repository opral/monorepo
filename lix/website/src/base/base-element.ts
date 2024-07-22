import { LitElement } from "lit"
import { customElement } from "lit/decorators.js"

@customElement("base-element")
export class BaseElement extends LitElement {
	// @ts-ignore
	protected createRenderRoot(): Element | ShadowRoot {
		const root = this.attachShadow({ mode: "open" })
		const link = document.createElement("link")
		link.rel = "stylesheet"
		link.href = "/src/style.css"

		root.appendChild(link)
		return root
	}
}
