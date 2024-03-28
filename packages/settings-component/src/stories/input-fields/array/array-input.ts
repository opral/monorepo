import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../../../styling/base.js"
import "./default-array-input.js"
import "./languageTags-input.js"
import "./reference-pattern-input.js"

@customElement("array-input")
export class ArrayInput extends LitElement {
	static override styles = [baseStyling]

	@property()
	property: string = ""

	@property()
	moduleId?: string

	@property()
	value: Array<string> = []

	@property()
	schema: any = {}

	@property()
	handleInlangProjectChange: (value: Array<string>, key: string, moduleId?: string) => void =
		() => {}

	override render() {
		const schemaPattern = this.schema.items.pattern

		if (
			schemaPattern &&
			schemaPattern ===
				"^((?<grandfathered>(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?<language>([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?))(-(?<script>[A-Za-z]{4}))?(-(?<region>[A-Za-z]{2}|[0-9]{3}))?(-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*))$"
		) {
			return html`
				<language-tags-input
					exportparts="property, property-title, property-paragraph"
					.property=${this.property}
					.moduleId=${this.moduleId}
					.value=${this.value}
					.schema=${this.schema}
					.handleInlangProjectChange=${this.handleInlangProjectChange}
				></language-tags-input>
			`
		} else if (this.property === "variableReferencePattern") {
			return html`
				<reference-pattern-input
					exportparts="property, property-title, property-paragraph"
					.property=${this.property}
					.moduleId=${this.moduleId}
					.value=${this.value}
					.schema=${this.schema}
					.handleInlangProjectChange=${this.handleInlangProjectChange}
				></reference-pattern-input>
			`
		} else {
			return html`
				<default-array-input
					exportparts="property, property-title, property-paragraph"
					.property=${this.property}
					.moduleId=${this.moduleId}
					.value=${this.value}
					.schema=${this.schema}
					.handleInlangProjectChange=${this.handleInlangProjectChange}
				></default-array-input>
			`
		}
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"array-input": ArrayInput
	}
}
