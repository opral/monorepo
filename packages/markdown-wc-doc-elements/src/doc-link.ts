import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

export class DocLink extends LitElement {
	static override styles = css`
		a {
			text-decoration: none;
			color: inherit;
			display: inner-block;
			margin: 0;
		}
		.doc-link {
			padding: 1rem;
			border-radius: 0.5rem;
			background-color: #f1f5f9;
			transition: background-color 0.2s ease-in-out;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
		.doc-link:hover {
			background-color: #e1e7f0;
		}
		.doc-link > * {
			margin: 0;
		}
		.doc-link > h4 {
			font-weight: 600;
		}
		.icons {
			display: flex;
			justify-content: flex-start;
			gap: 8px;
			margin-bottom: 16px;
		}
		.icon {
			display: flex;
			width: 40px;
			height: 40px;
			justify-content: center;
			align-items: center;
			border-radius: 8px;
			background-color: #e3e8ee;
			color: #475569;
		}
	`
	@property()
	override title: string = ""
	@property()
	icon: string = ""
	@property()
	href: string = ""
	@property()
	description: string = ""

	override render() {
		return html`<a href="${this.href}" target="${this.href.includes("http") ? `_blank` : ``}">
			<div class="doc-link">
				<div class="icons">
					<div class="icon">
						<doc-icon icon=${this.icon} size="1.5em"></doc-icon>
					</div>
				</div>
				<h4>${this.title}</h4>
				<p>${this.description}</p>
			</div>
		</a>`
	}
}

// takes the inner elements and just renders them with custom styles around them
@customElement("doc-links")
export class DocLinks extends LitElement {
	static override styles = css`
		.doc-link-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			grid-gap: 1rem;
		}
	`

	override render() {
		return html`<div class="doc-link-grid">
			<slot></slot>
		</div>`
	}
}
