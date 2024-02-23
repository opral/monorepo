import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../../styling/base.js"
import "@shoelace-style/shoelace/dist/components/input/input.js"

@customElement("simple-input")
export class SimpleInput extends LitElement {
	static override styles = baseStyling

	@property()
	property: string = ""

	@property()
	moduleId?: string

	@property()
	value: string = ""

	@property()
	schema: any = {}

	@property()
	handleInlangProjectChange: (value: string, key: string, moduleId?: string) => void = () => {}

	private get _description(): string | undefined {
		return this.schema.description || undefined
	}

	override render() {
		return html` <div>
			<sl-input
				label=${this.property}
				help-text=${this._description}
				value=${JSON.stringify(this.value)}
				@sl-change=${(e: Event) => {
					this.handleInlangProjectChange(
						(e.target as HTMLInputElement).value,
						this.property,
						this.moduleId
					)
				}}
			></sl-input>
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"simple-input": SimpleInput
	}
}
