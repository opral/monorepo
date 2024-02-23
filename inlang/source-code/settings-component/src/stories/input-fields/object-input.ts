import { css, html, LitElement } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { baseStyling } from "../../styling/base.js"
import "@shoelace-style/shoelace/dist/components/input/input.js"
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js"
import "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.14.0/cdn/components/icon/icon.js"
import type { InlangModule } from "@inlang/sdk"

@customElement("object-input")
export class ObjectInput extends LitElement {
	static override styles = [
		baseStyling,
		css`
			.container {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
			.help-text {
				font-size: 0.8rem;
				color: var(--sl-input-help-text-color);
				margin-top: 0.2rem;
				margin-bottom: 0.2rem;
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
		`,
	]

	@property()
	property: string = ""

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
		return html` <div class="container">
			${this.property} ${this._description && html`<p class="help-text">${this._description}</p>`}
			${this.value &&
			Object.entries(this.value).map(([key, value]) => {
				return html`<div class="add-item-container">
					<sl-input class="disabled-input add-item-side" value=${key} disabled filled> </sl-input>
					<sl-input class="disabled-input add-item-side" value=${value} disabled filled> </sl-input>
					<sl-icon-button
						@click=${() => {
							this.handleDeleteItemClick(key as InlangModule["default"]["id"])
						}}
						name="trash"
					></sl-icon-button>
				</div>`
			})}
			<div class="add-item-container">
				<sl-input
					class="add-item-side"
					placeholder="Enter key"
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
					placeholder="Enter value"
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
				<sl-icon-button
					@click=${() => {
						this.handleAddItemClick()
					}}
					name="plus-circle"
				></sl-icon-button>
			</div>
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"object-input": ObjectInput
	}
}
