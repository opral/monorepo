import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

export class DocImportant extends LitElement {
	static override styles = css`
		.doc-important {
			padding: 0.5rem 2rem;
			border-radius: 0.5rem;
			background-color: #dff7fc;
			display: flex;
			flex-direction: column;
			border: 1px solid #00daff;
		}
		.doc-important > .title {
			font-weight: 500;
			color: #0891b2;
			padding-top: 1rem;
			font-size: 1.25rem;
		}
	`
	@property()
	override title: string = ""
	@property()
	description: string = ""

	override render() {
		return html`
			<div class="doc-important">
				<div class="title">${this.title}</div>
				<p>${this.description}</p>
			</div>
		`
	}
}
