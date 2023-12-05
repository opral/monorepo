import { LitElement, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { convert } from "../convert.js"

type url = `https://${string}`

@customElement("doc-embed")
export class DocEmbed extends LitElement {
	@property()
	url: url | undefined = undefined

	@property()
	html: string | undefined = undefined

	override async connectedCallback() {
		super.connectedCallback()

		if (this.url) {
			const text = await fetch(this.url).then((res) => res.text())
			this.html = await convert(text)
		}
	}

	override render() {
		return html` <div .innerHTML=${this.html}></div>`
	}
}
