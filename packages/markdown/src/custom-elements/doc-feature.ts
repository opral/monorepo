import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("doc-feature")
export class DocFeature extends LitElement {
	static override styles = css`
		.feature-card {
			display: flex;
			flex-grow: 1;
			flex-direction: column;
			align-items: center;
			justify-content: end;
			padding: 1rem;
			border-radius: 0.5rem;
			background-color: #e3e8ed;
			height: 200px;
			overflow: hidden;
		}
		.feature-name {
			padding-top: 1rem;
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
	@property()
	"text-color"?: string = ""

	override render() {
		return html`<div
			class="feature-card"
			style="${this.color ? `background-color: ${this.color}` : ""}"
		>
			${this.icon &&
			html`<iconify-icon
				height="64px"
				style="margin-bottom: 24px; color: ${this["text-color"] ? this["text-color"] : "#0f172a"}"
				icon=${this.icon}
			></iconify-icon>`}
			${this.image && html`<img src=${this.image} height="128px" style="flex-grow: 1;" />`}
			<p class="feature-name" style="${this["text-color"] ? `color: ${this["text-color"]}` : ""}">
				${this.title}
			</p>
		</div>`
	}
}

@customElement("doc-features")
export class DocFeatures extends LitElement {
	static override styles = css`
		.doc-features-container {
			display: flex;
			flex-wrap: wrap;
			gap: 1rem;
			flex-direction: row;
			width: 100%;
		}

		::slotted(doc-feature) {
			flex-grow: 2;
			min-width: 200px;
		}
	`

	override render() {
		return html`<div class="doc-features-container">
			<slot class="doc-feature-container"></slot>
		</div>`
	}
}
