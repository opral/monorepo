import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("doc-figure")
export class DocFigure extends LitElement {
	static override styles = css``

	@property()
	src?: string = ""
	alt?: string = ""
	caption?: string = ""

	override render() {
		return html`
			<figure>
				<img src="${this.src}" alt="${this.alt}" />
				<figcaption>${this.caption}</figcaption>
			</figure>
		`
	}
}
