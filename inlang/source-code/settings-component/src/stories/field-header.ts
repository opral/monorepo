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
		`,
	]

	@property()
	fieldTitle?: string

	@property()
	description?: string

	@property()
	examples?: string

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
			${this.examples && html`<p part="property-paragraph" class="help-text">${this.examples}</p>`}
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"field-header": FieldHeader
	}
}
