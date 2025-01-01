import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
//import { baseStyling } from "../../../styling/base.js"

@customElement("field-header")
export class FieldHeader extends LitElement {
	static override styles = [
		//baseStyling,
		css`
			.header {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
			h3 {
				margin: 0;
				font-size: 14px;
				font-weight: 800;
				line-height: 1.5;
			}
			.help-text {
				font-size: 14px;
				color: var(--sl-input-help-text-color);
				margin: 0;
				line-height: 1.5;
			}
			.optinal {
				font-size: 14px;
				font-style: italic;
				font-weight: 500;
				color: var(--sl-input-help-text-color);
			}
			.example-container {
				display: flex;
				flex-wrap: wrap;
				gap: 4px;
			}
			.example {
				background-color: var(--sl-input-background-color-disabled);
				width: fit-content;
				padding: 0px 6px;
				border-radius: 2px;
				font-size: 14px;
				display: flex;
				align-items: center;
				justify-content: center;
				color: var(--sl-input-color-disabled);
				margin: 0;
				line-height: 1.5;
			}
		`,
	]

	@property()
	fieldTitle?: string

	@property()
	description?: string

	@property({ type: Array })
	examples?: Array<string>

	@property({ type: Boolean })
	optional?: boolean = false

	override render() {
		return html` <div class="header">
			${this.fieldTitle &&
			html`<h3 part="property-title">
				${this.fieldTitle}${this.optional
					? html`<span class="optinal">${" " + "(optional)"}</span>`
					: ""}
			</h3>`}
			${this.description &&
			html`<p part="property-paragraph" class="help-text">${this.description}</p>`}
			${this.examples
				? html`<div class="example-container">
						<p class="help-text">Examples:</p>
						${this.examples.map((example) => html`<p class="example">${example}</p>`)}
				  </div>`
				: ``}
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"field-header": FieldHeader
	}
}
