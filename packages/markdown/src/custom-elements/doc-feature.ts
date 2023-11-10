import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("doc-feature")
export class DocFeature extends LitElement {
	static override styles = css`
		.feature-card {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: end;
			gap: 2rem;
			padding: 1rem;
			border-radius: 0.5rem;
			background-color: #e3e8ed;
			height: 200px;
			overflow: hidden;
		}
		.feature-name {
			font-weight: 500;
			color: #0f172a;
			margin: 0;
		}
	`

	@property()
	override title: string = ""
	@property()
	icon?: string = ""
	@property()
	image?: string = ""
	@property()
	color?: string = ""

	override render() {
		return html`<div
			class="feature-card"
			style="${this.color ? `background-color: ${this.color}` : ""}"
		>
			${this.icon &&
			html`<iconify-icon
				height="64px"
				style="margin-bottom: 24px;"
				icon=${this.icon}
			></iconify-icon>`}
			${this.image && html`<img src=${this.image} height="128px" />`}
			<p class="feature-name">${this.title}</p>
		</div>`
	}
}

@customElement("doc-features")
export class DocFeatures extends LitElement {
	static override styles = css`
		.doc-features-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 1rem;
			width: 100%;
		}

		@media (max-width: 1100px) {
			.doc-features-grid {
				grid-template-columns: repeat(2, 1fr);
			}
		}

		@media (max-width: 700px) {
			.doc-features-grid {
				grid-template-columns: repeat(1, 1fr);
			}
		}
	`

	override render() {
		return html`<div class="doc-features-grid">
			<slot></slot>
		</div>`
	}
}
