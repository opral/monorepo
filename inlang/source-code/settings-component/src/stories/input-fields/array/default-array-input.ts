import { css, html, LitElement } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { baseStyling } from "../../../styling/base.js"
import "@shoelace-style/shoelace/dist/components/input/input.js"
import "@shoelace-style/shoelace/dist/components/tag/tag.js"
import "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.14.0/cdn/components/icon/icon.js"

@customElement("default-array-input")
export class DefaultArrayInput extends LitElement {
	static override styles = [
		baseStyling,
		css`
			.item-container {
				display: flex;
				flex-direction: column;
				gap: 4px;
				padding-bottom: 8px;
			}
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

	@state()
	private _inputValue: string | undefined = undefined

	handleInputChange(e: Event) {
		const inputElement = e.target as HTMLInputElement
		this._inputValue = inputElement.value
	}

	handleAddItemClick() {
		if (this._inputValue && this._inputValue.trim() !== "") {
			this.value ? this.value.push(this._inputValue) : (this.value = [this._inputValue])
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = undefined
			this.requestUpdate()
		}
	}

	handleDeleteItemClick(index: number) {
		if (this.value) {
			this.value.splice(index, 1)
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = undefined
			this.requestUpdate()
		}
	}

	override render() {
		return html`<div class="container">
			<p>${this.property}</p>
			${this._description && html`<p class="help-text">${this._description}</p>`}
			${this.value && this.value.length > 0
				? html`<div class="item-container">
						${this.value.map((arrayItem, index) => {
							return html`<sl-input
								class="disabled-input"
								size="small"
								value=${arrayItem}
								disabled
								filled
							>
								<sl-icon
									@click=${() => {
										this.handleDeleteItemClick(index)
									}}
									slot="suffix"
									name="x-lg"
								></sl-icon>
							</sl-input>`
						})}
				  </div>`
				: undefined}
			<div class="new-line-container">
				<sl-input
					class="add-input"
					size="small"
					placeholder="Add new item"
					@input=${(e: Event) => this.handleInputChange(e)}
					@keydown=${(e: KeyboardEvent) => {
						if (e.key === "Enter") {
							this.handleAddItemClick()
						}
					}}
					value=${this._inputValue}
				>
				</sl-input>
				<sl-button
					size="small"
					variant="neutral"
					@click=${() => {
						this.handleAddItemClick()
					}}
				>
					Add
				</sl-button>
			</div>
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"default-array-input": DefaultArrayInput
	}
}
