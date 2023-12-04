import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { convert } from "../convert.js"
import fs from "node:fs/promises"
import path from "node:path"

@customElement("doc-embed")
export class DocEmbed extends LitElement {
	static override styles = css``

	@property()
	path: string = ""

	connectedCallback() {
		super.connectedCallback()
	}

	override render() {
		return html` <div>${this.path}</div>`
	}
}
