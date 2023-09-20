import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("doc-figure")
export class DocFigure extends LitElement {
	static override styles = css`
		figure {
			margin: 0;
			margin-top: 2em;
			margin-bottom: 2em;
		}
		img {
			width: 100%;
		}
		figcaption {
			font-size: 12px;
			color: #64748b;
			margin-top: 0.5em;
			padding-left: 16px;
			padding-right: 16px;
		}
	`
	@property()
	src: string = ""
	@property()
	alt: string = ""
	@property()
	caption: string = ""

	override render() {
		return html`<figure>
			<img src="${this.src}" alt="${this.alt}" />
			<figcaption>${this.caption}</figcaption>
		</figure>`
	}
}
