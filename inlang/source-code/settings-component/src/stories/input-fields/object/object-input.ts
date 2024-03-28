import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../../../styling/base.js"
import { InlangModule } from "@inlang/sdk"
import "./default-object-input.js"
import "./lint-rule-level-object-input.js"

@customElement("object-input")
export class ObjectInput extends LitElement {
	static override styles = [baseStyling]

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
	handleInlangProjectChange: (
		value: Record<InlangModule["default"]["id"], string>,
		key: string,
		moduleId?: string
	) => void = () => {}

	override render() {
		if (this.property === "messageLintRuleLevels") {
			return html`<lint-rule-level-object-input
				exportparts="property, property-title, property-paragraph"
				.property=${this.property}
				.moduleId=${this.moduleId}
				.modules=${this.modules}
				.value=${this.value}
				.schema=${this.schema}
				.handleInlangProjectChange=${this.handleInlangProjectChange}
			></lint-rule-level-object-input>`
		} else {
			return html`<default-object-input
				exportparts="property, property-title, property-paragraph"
				.property=${this.property}
				.moduleId=${this.moduleId}
				.value=${this.value}
				.schema=${this.schema}
				.keyPlaceholder=${this.keyPlaceholder}
				.valuePlaceholder=${this.valuePlaceholder}
				.handleInlangProjectChange=${this.handleInlangProjectChange}
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
