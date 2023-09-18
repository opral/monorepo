import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("quick-link")
export class QuickLink extends LitElement {
	static override styles = css`
		a {
			text-decoration: none;
			color: inherit;
			display: inner-block;
			margin: 0;
		}
		.quick-link {
			padding: 1rem;
			border-radius: 0.5rem;
			background-color: #f1f5f9;
			transition: background-color 0.2s ease-in-out;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
		.quick-link:hover {
			background-color: #e2e8f0;
		}
		.quick-link > * {
			margin: 0;
		}
		.quick-link > h4 {
			font-weight: 600;
		}
	`
	@property({ type: String })
	override title = ""
	@property({ type: String })
	icon = ""
	@property({ type: String })
	href = ""
	@property({ type: String })
	description = ""

	override render() {
		return html`<a href="${this.href}">
			<div class="quick-link">
				<h4>${this.title}</h4>
				<p>${this.description}</p>
			</div>
		</a>`
	}
}

// takes the inner elements and just renders them with custom styles around them
@customElement("quick-links")
export class QuickLinks extends LitElement {
	static override styles = css`
		.quick-link-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			grid-gap: 1rem;
		}
	`

	override render() {
		return html`<div class="quick-link-grid">
			<slot></slot>
		</div>`
	}
}
