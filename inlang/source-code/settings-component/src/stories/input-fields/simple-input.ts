import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../../styling/base.js"
import "./string/string-input.js"
import "./array/array-input.js"
import "./object/object-input.js"
import "./union/path-pattern-input.js"
@customElement("simple-input")
export class SimpleInput extends LitElement {
	static override styles = baseStyling

	@property()
	property: string = ""

	@property()
	moduleId?: string

	@property()
	modules?: string

	@property()
	value: string = ""

	@property()
	schema: any = {}

	@property()
	handleInlangProjectChange: (value: string, key: string, moduleId?: string) => void = () => {}

	override render() {
		if (this.schema.type) {
			if (this.schema.type === "string") {
				return html` <div>
					<string-input
						.property=${this.property}
						.moduleId=${this.moduleId}
						.value=${this.value}
						.schema=${this.schema}
						.handleInlangProjectChange=${this.handleInlangProjectChange}
					></string-input>
				</div>`
			} else if (this.schema.type === "array") {
				return html` <div>
					<array-input
						.property=${this.property}
						.moduleId=${this.moduleId}
						.value=${this.value}
						.schema=${this.schema}
						.handleInlangProjectChange=${this.handleInlangProjectChange}
					></array-input>
				</div>`
			} else if (this.schema.type === "object") {
				return html` <div>
					<object-input
						.property=${this.property}
						.moduleId=${this.moduleId}
						.modules=${this.modules}
						.value=${this.value}
						.schema=${this.schema}
						.handleInlangProjectChange=${this.handleInlangProjectChange}
					></object-input>
				</div>`
			} else {
				return html` <div>
					<string-input
						.property=${this.property}
						.moduleId=${this.moduleId}
						.value=${this.value}
						.schema=${this.schema}
						.handleInlangProjectChange=${this.handleInlangProjectChange}
					></string-input>
				</div>`
			}
		} else if (this.property === "pathPattern" || this.property === "sourceLanguageFilePath") {
			return html` <div>
				<path-pattern-input
					.property=${this.property}
					.moduleId=${this.moduleId}
					.value=${this.value}
					.schema=${this.schema}
					.handleInlangProjectChange=${this.handleInlangProjectChange}
				></path-pattern-input>
			</div>`
		} else {
			return html` <div>
				<string-input
					.property=${this.property}
					.moduleId=${this.moduleId}
					.value=${this.value}
					.schema=${this.schema}
					.handleInlangProjectChange=${this.handleInlangProjectChange}
				></string-input>
			</div>`
		}
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"simple-input": SimpleInput
	}
}
