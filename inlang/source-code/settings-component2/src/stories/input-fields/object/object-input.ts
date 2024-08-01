import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
//import { baseStyling } from "../../../styling/base.js"
import { InlangModule } from "@inlang/sdk"
import "./default-object-input.js"
import "./lint-rule-level-object-input.js"

@customElement("object-input")
export class ObjectInput extends LitElement {
	//static override styles = [baseStyling]

	@property()
	property: string = ""

	@property()
	moduleId?: string

	@property()
	modules?: object

	@property()
	keyPlaceholder?: string

	@property()
	valuePlaceholder?: string

	@property()
	value: Record<InlangModule["default"]["id"], string> = {}

	@property()
	schema: any = {}

	@property()
	withTitle?: boolean = true

	@property()
	withDescription?: boolean = true

	@property()
	required?: boolean = false

	@property()
	handleInlangProjectChange: (
		value: Record<InlangModule["default"]["id"], string>,
		key: string,
		moduleId?: string
	) => void = () => {}

	override render() {
		if (this.property === "messageLintRuleLevels") {
			return html`<lint-rule-level-object-input
				exportparts="property, property-title, property-paragraph, option, option-wrapper"
				.property=${this.property}
				.moduleId=${this.moduleId}
				.modules=${this.modules}
				.value=${this.value}
				.schema=${this.schema}
				.handleInlangProjectChange=${this.handleInlangProjectChange}
				.required=${this.required}
			></lint-rule-level-object-input>`
		} else {
			return html`<default-object-input
				exportparts="property, property-title, property-paragraph, button"
				.property=${this.property}
				.moduleId=${this.moduleId}
				.value=${this.value}
				.schema=${this.schema}
				.keyPlaceholder=${this.keyPlaceholder}
				.valuePlaceholder=${this.valuePlaceholder}
				.handleInlangProjectChange=${this.handleInlangProjectChange}
				.withTitle=${this.withTitle}
				.withDescription=${this.withDescription}
				.required=${this.required}
			></default-object-input>`
		}
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"object-input": ObjectInput
	}
}
