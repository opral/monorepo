import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("doc-comment")
export class DocComment extends LitElement {
	static override styles = css`
		:host {
			display: inline-flex;
			height: auto;
		}

		.comment-wrapper {
			background-color: #f1f5f9;
			border-radius: 0.5rem;
			padding: 1rem;
			margin: 0;
			font-size: 0.9rem;
			color: #64748b;
		}
	`

	@property()
	text: string = "TEST"
	@property()
	name: string = "test"
	@property()
	icon?: string = ""

	override render() {
		return html`<div class="comment-wrapper">${this.text}</div>`
	}
}
