import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { convert } from "../convert.js"

@customElement("doc-embed")
export class DocEmbed extends LitElement {
	static override styles = css``

	private copied = false
	@property()
	relativePath: string = ""

	override render() {
		return html` <div>${convert(this.relativePath)}</div>`
	}
}
