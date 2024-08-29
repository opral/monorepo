import { type Variant } from "@inlang/sdk2"
import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../../styling/base.js"

//helpers
import overridePrimitiveColors from "../../helper/overridePrimitiveColors.js"
import { createChangeEvent } from "../../helper/event.js"

//components
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"

if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)
if (!customElements.get("sl-tooltip")) customElements.define("sl-tooltip", SlTooltip)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)

@customElement("inlang-variant")
export default class InlangVariant extends LitElement {
	static override styles = [
		baseStyling,
		css`
			div {
				box-sizing: border-box;
				font-size: 14px;
			}
			:host {
				border-top: 1px solid var(--sl-input-border-color) !important;
			}
			:host(:first-child) {
				border-top: none !important;
			}
			.variant {
				position: relative;
				min-height: 44px;
				width: 100%;
				display: flex;
				align-items: stretch;
			}
			.match {
				min-height: 44px;
				width: 120px;
				background-color: var(--sl-input-background-color);
				border-right: 1px solid var(--sl-input-border-color);
				position: relative;
				z-index: 0;
			}
			.match:focus-within {
				z-index: 3;
			}
			.match::part(base) {
				border: none;
				border-radius: 0;
				min-height: 44px;
			}
			.match::part(input) {
				min-height: 44px;
			}
			.match::part(input):hover {
				background-color: var(--sl-input-background-color-);
			}
			.variant {
				position: relative;
				z-index: 0;
			}
			.variant:focus-within {
				z-index: 3;
			}
			.actions {
				position: absolute;
				top: 0;
				right: 0;
				height: 44px;
				display: flex;
				align-items: center;
				gap: 4px;
				padding-right: 12px;
				z-index: 1;
			}
			.add-selector::part(base) {
				border-radius: 4px;
				cursor: pointer;
				font-size: 13px;
			}
			sl-button::part(base) {
				color: var(--sl-input-color);
				background-color: var(--sl-input-background-color);
				border: 1px solid var(--sl-input-border-color);
			}
			sl-button::part(base):hover {
				color: var(--sl-input-color-hover);
				background-color: var(--sl-input-background-color-hover);
				border: 1px solid var(--sl-input-border-color-hover);
			}
			.dynamic-actions {
				display: flex;
				align-items: center;
				gap: 4px;
				z-index: 3;
			}
			.hide-dynamic-actions {
				display: none;
			}
			.variant:hover .dynamic-actions {
				display: flex;
			}
			.dropdown-open.dynamic-actions {
				display: flex;
			}
			sl-tooltip::part(base) {
				background-color: var(--sl-tooltip-background-color);
				color: var(--sl-tooltip-color);
			}
			.history-button {
				position: relative;
				z-index: 0;
			}
		`,
	]

	@property()
	variant: Variant | undefined

	private _delete = () => {
		if (this.variant) {
			this.dispatchEvent(
				createChangeEvent({
					type: "Variant",
					operation: "delete",
					newData: this.variant,
				})
			)
		}
	}

	private _updateMatch = (selectorName: string, value: string) => {
		//TODO improve this function
		if (this.variant) {
			const newVariant = structuredClone(this.variant)

			// if matchName is not in variant, return
			if (newVariant.match[selectorName]) {
				// update the match with value (mutates variant)
				newVariant.match[selectorName] = value
			}

			this.dispatchEvent(
				createChangeEvent({
					type: "Variant",
					operation: "update",
					newData: newVariant,
				})
			)
		}
	}

	//hooks
	override async firstUpdated() {
		await this.updateComplete

		//get all sl-inputs and set the color to the inlang colors
		overridePrimitiveColors()
	}

	override render() {
		return this.variant
			? html`<div class="variant">
					${this.variant
						? Object.entries(this.variant.match).map(([selectorName, match]) => {
								return html`
									<sl-input
										id="${this.variant!.id}-${match}"
										class="match"
										size="small"
										value=${match}
										@sl-blur=${(e: Event) => {
											const element = this.shadowRoot?.getElementById(
												`${this.variant!.id}-${match}`
											)
											if (element && e.target === element) {
												this._updateMatch(selectorName, (e.target as HTMLInputElement).value)
											}
										}}
									></sl-input>
								`
						  })
						: undefined}
					<slot name="pattern-editor" class="pattern-editor"></slot>
					<div class="actions">
						<div class="dynamic-actions hide-dynamic-actions">
							<slot name="variant-action"></slot>
							${this.variant.pattern
								? html`<sl-tooltip content="Delete"
										><sl-button size="small" @click=${() => this._delete()}
											><svg
												xmlns="http://www.w3.org/2000/svg"
												width="18px"
												height="18px"
												viewBox="0 0 24 24"
												slot="prefix"
												style="margin-right: -2px; margin-left: -2px"
											>
												<g fill="none">
													<path
														d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"
													/>
													<path
														fill="currentColor"
														d="M20 5a1 1 0 1 1 0 2h-1l-.003.071l-.933 13.071A2 2 0 0 1 16.069 22H7.93a2 2 0 0 1-1.995-1.858l-.933-13.07L5 7H4a1 1 0 0 1 0-2zm-3.003 2H7.003l.928 13h8.138zM14 2a1 1 0 1 1 0 2h-4a1 1 0 0 1 0-2z"
													/>
												</g></svg></sl-button
								  ></sl-tooltip>`
								: ``}
						</div>
						<slot name="edit-status"></slot>
					</div>
			  </div>`
			: undefined
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-variant": InlangVariant
	}
}
