import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
//import { baseStyling } from "../../../styling/base.js"

@customElement("reference-pattern-input")
export class ReferencePatternInput extends LitElement {
	static override styles = [
		//baseStyling,
		css`
			.help-text {
				font-size: 0.8rem;
				color: var(--sl-input-help-text-color);
			}
			.disabled-input::part(base) {
				cursor: unset;
				opacity: 1;
			}
			.disabled-input::part(suffix) {
				cursor: pointer;
				opacity: 0.5;
			}
			.disabled-input::part(suffix):hover {
				opacity: 1;
			}
			.add-input::part(form-control-label) {
				color: var(--sl-input-help-text-color);
				font-size: 0.8rem;
				padding-left: 0.2rem;
				padding-bottom: 0.2rem;
			}
			.add-input {
				flex-grow: 1;
			}
			.add-input::part(suffix) {
				cursor: pointer;
			}
			.new-line-container {
				display: flex;
				gap: 4px;
			}
		`,
	]

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

	private get _description(): string | undefined {
		return this.schema.description || undefined
	}

	private get _examples(): string | undefined {
		return this.schema.examples ? "Example: " + JSON.stringify(this.schema.examples) : undefined
	}

	override render() {
		return html`<div part="property" class="container">
			<h3 class="property-title">${this.property}</h3>
			${this._description &&
			html`<p part="property-paragraph" class="help-text">${this._description}</p>`}
			${this._examples &&
			html`<p part="property-paragraph" class="help-text">${this._examples}</p>`}
			<div class="new-line-container">
				<sl-input
					class="add-input"
					size="small"
					label="Opening pattern"
					placeholder="Enter pattern ..."
					value=${this.value ? this.value[0] : ""}
					@input=${(e: Event) => {
						if (this.value === undefined) this.value = []
						this.value[0] = (e.target as HTMLInputElement).value
						this.handleInlangProjectChange(this.value, this.property, this.moduleId)
					}}
				>
				</sl-input>
				<sl-input
					class="add-input"
					size="small"
					label="Closing pattern (not required)"
					placeholder="Enter pattern ..."
					?disabled=${!this.value}
					value=${this.value ? this.value[1] : ""}
					@input=${(e: Event) => {
						if (this.value === undefined) this.value = []
						this.value[1] = (e.target as HTMLInputElement).value
						this.handleInlangProjectChange(this.value, this.property, this.moduleId)
					}}
				>
				</sl-input>
			</div>
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"reference-pattern-input": ReferencePatternInput
	}
}
