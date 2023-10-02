import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("badge-generator")
export class BadgeGenerator extends LitElement {
	static override styles = css`
		.generator-wrapper {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100%;
			width: 100%;
		}
		.badge-showcase {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			justify-content: center;
			gap: 1rem;
			background: #f1f5f9;
		}
	`
	// @property()
	// src: string = ""
	// @property()
	// alt: string = ""
	// @property()
	// caption: string = ""

	override render() {
		return html`<div class="generator-wrapper">
			<div class="badge-showcase">Test</div>
		</div>`
	}
}
