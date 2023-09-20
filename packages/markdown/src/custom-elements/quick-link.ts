import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
// import { WebIcon } from "./web-icon.js"

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
			background-color: #e1e7f0;
		}
		.quick-link > * {
			margin: 0;
		}
		.quick-link > h4 {
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
	icon: "fast" | "add-plugin" | "" = ""
	@property()
	href: string = ""
	@property()
	description: string = ""

	override render() {
		return html`<a href="${this.href}">
			${this.icon !== ""
				? html`<script src="https://cdn.jsdelivr.net/npm/iconify-icon@1.0.8/dist/iconify-icon.min.js"></script>`
				: ""}
			<div class="quick-link">
				<div class="icons">
					<div class="icon">
						<web-icon icon=${this.icon}></web-icon>
					</div>
				</div>
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
