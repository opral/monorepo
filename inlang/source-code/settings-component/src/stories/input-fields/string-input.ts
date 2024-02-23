import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../../styling/base.js"
import "@shoelace-style/shoelace/dist/components/input/input.js"

@customElement("string-input")
export class StringInput extends LitElement {
	static override styles = [
		baseStyling,
		css`
			.help-text {
				font-size: 0.8rem;
				color: var(--sl-input-help-text-color);
				margin-top: 0.2rem;
				margin-bottom: 0.2rem;
			}
		`,
	]

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
			${this.property}
			<p class="help-text">${this._description}</p>
			<sl-input
				value=${this.value}
				@input=${(e: Event) => {
					this.handleInlangProjectChange(
						(e.target as HTMLInputElement).value,
						this.property,
						this.moduleId
					)
				}}
			>
				<p slot="suffix">string</p>
			</sl-input>
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"string-input": StringInput
	}
}
