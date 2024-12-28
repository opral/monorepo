import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

export class DocHeader extends LitElement {
	static override styles = css`
		a {
			text-decoration: none;
			color: inherit;
			display: inner-block;
			margin: 0;
		}
		.doc-header {
			margin-top: 48px;
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			justify-content: space-between;
			align-items: end;
			border-bottom: solid 1px #e3e8ec;
			padding-bottom: 1.5rem;
		}
		.doc-header-text-container {
		}
		.doc-header-text-container p {
			margin: 0;
			margin-top: 0.5rem;
			color: #1e293b;
		}
		.doc-header-text-container h1 {
			margin: 0;
			font-weight: 600;
			color: #1e293b;
		}
		.doc-header-button {
			height: 40px;
			display: flex;
			align-items: center;
			padding: 0px 16px;
			border-radius: 0.375rem;
			background-color: #1e293b;
			color: #ffffff;
			font-weight: 500;
			font-size: 14px;
			margin-top: 2rem;
		}
	`
	@property()
	override title: string = ""
	@property()
	description: string = ""
	@property()
	button: string = ""
	@property()
	link: string = ""

	override render() {
		return html`<div class="doc-header">
			<div class="doc-header-text-container">
				<h1>${this.title}</h1>
				<p>${this.description}</p>
			</div>
			<a class="doc-header-button" href="${this.link}">${this.button}</a>
		</div>`
	}
}
