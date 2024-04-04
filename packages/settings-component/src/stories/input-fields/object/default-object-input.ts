import { css, html, LitElement } from "lit"
import { customElement, property, state } from "lit/decorators.js"
//import { baseStyling } from "../../../styling/base.js"
import { InlangModule } from "@inlang/sdk"

@customElement("default-object-input")
export class DefaultObjectInput extends LitElement {
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
			.add-input::part(suffix) {
				cursor: pointer;
			}
			.add-item-container {
				display: flex;
				align-items: center;
				gap: 4px;
			}
			.add-item-side {
				flex-grow: 1;
			}
			.remove-icon {
				width: 44px;
				display: flex;
				justify-content: flex-start;
				margin-left: 6px;
				cursor: pointer;
				color: var(--sl-color-gray-500);
			}
			.remove-icon:hover {
				color: var(--sl-color-gray-950);
			}
			.list-container {
				display: flex;
				flex-direction: column;
				gap: 3px;
				padding-bottom: 8px;
			}
			.icon {
				padding-top: 0.5rem;
			}
		`,
	]

	@property()
	property: string = ""

	@property()
	keyPlaceholder?: string = "Enter key"

	@property()
	valuePlaceholder?: string = "Enter value"

	@property()
	moduleId?: string

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

	private get _description(): string | undefined {
		return this.schema.description || undefined
	}

	@state()
	private _inputValue: string | undefined = undefined

	@state()
	private _inputKey: string | undefined = undefined

	handleAddItemClick() {
		if (
			this._inputValue &&
			this._inputKey &&
			this._inputValue.trim() !== "" &&
			this._inputKey.trim() !== ""
		) {
			if (!this.value) {
				this.value = {}
			}
			this.value[this._inputKey as any] = this._inputValue
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = undefined
			this._inputKey = undefined
			this.requestUpdate()
		}
	}

	handleDeleteItemClick(key: InlangModule["default"]["id"]) {
		if (this.value) {
			delete this.value[key]
			this.handleInlangProjectChange(this.value, this.property, this.moduleId)
			this._inputValue = undefined
			this._inputKey = undefined
			this.requestUpdate()
		}
	}

	override render() {
		return html` <div part="property">
			${this._description && html`<h3 part="property-title">${this.property}</h3>`}
			${this._description &&
			html`<p part="property-paragraph" class="help-text">${this._description}</p>`}
			<div class="list-container">
				${this.value &&
				Object.entries(this.value).map(([key, value]) => {
					return html`<div class="add-item-container">
						<sl-input
							class="disabled-input add-item-side"
							size="small"
							value=${key}
							disabled
							filled
						>
						</sl-input>
						<sl-input
							class="disabled-input add-item-side"
							size="small"
							value=${value}
							disabled
							filled
						>
						</sl-input>
						<div class="remove-icon">
							<div
								@click=${() => {
									this.handleDeleteItemClick(key as InlangModule["default"]["id"])
								}}
							>
								<svg class="icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
									<path
										xmlns="http://www.w3.org/2000/svg"
										d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"
									/>
								</svg>
							</div>
						</div>
					</div>`
				})}
			</div>
			<div class="add-item-container">
				<sl-input
					class="add-item-side"
					placeholder=${this.keyPlaceholder}
					size="small"
					@input=${(e: Event) => {
						this._inputKey = (e.target as HTMLInputElement).value
					}}
					@keydown=${(e: KeyboardEvent) => {
						if (e.key === "Enter") {
							this.handleAddItemClick()
						}
					}}
					value=${this._inputKey}
				>
				</sl-input>
				<sl-input
					class="add-item-side"
					placeholder=${this.valuePlaceholder}
					size="small"
					@input=${(e: Event) => {
						this._inputValue = (e.target as HTMLInputElement).value
					}}
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
		"default-object-input": DefaultObjectInput
	}
}
