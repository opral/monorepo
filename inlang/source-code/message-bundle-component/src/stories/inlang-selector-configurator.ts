import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js"
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js"
import SlTag from "@shoelace-style/shoelace/dist/components/tag/tag.component.js"
import type { Message } from "@inlang/sdk/v2"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-dropdown")) customElements.define("sl-dropdown", SlDropdown)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-select")) customElements.define("sl-select", SlSelect)
if (!customElements.get("sl-option")) customElements.define("sl-option", SlOption)
if (!customElements.get("sl-tag")) customElements.define("sl-tag", SlTag)

@customElement("inlang-selector-configurator")
export default class InlangSelectorConfigurator extends LitElement {
	static override styles = [
		css`
			.button-wrapper {
				height: 44px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.dropdown-container {
				font-size: 13px;
				width: 300px;
				background-color: white;
				border: 1px solid var(--sl-color-neutral-300);
				padding: 16px;
				border-radius: 6px;
				display: flex;
				flex-direction: column;
				gap: 16px;
			}
			sl-select::part(form-control-label) {
				font-size: 13px;
				color: var(--sl-color-neutral-700);
			}
			.dropdown-title {
				font-size: 14px;
				font-weight: 600;
				margin: 0;
			}
			.options-container {
			}
			.options-title {
				font-size: 13px;
				color: var(--sl-color-neutral-700);
				margin: 0;
				padding-bottom: 4px;
			}
			.options-wrapper {
				display: flex;
				gap: 4px;
				flex-wrap: wrap;
			}
		`,
	]

	@property()
	inputs: string[] | undefined

	@property()
	message: Message | undefined

	private _getPluralCategories = () => {
		return this.message?.locale
			? new Intl.PluralRules(this.message?.locale).resolvedOptions().pluralCategories
			: undefined
	}

	override render() {
		return html`
			<sl-dropdown distance="-4">
				<div slot="trigger" class="button-wrapper">
					<slot></slot>
				</div>
				<div class="dropdown-container">
					<sl-select label="Input" size="small" value=${this.inputs && this.inputs[0]}>
						${this.inputs &&
						this.inputs.map((inputs) => {
							return html`<sl-option value=${inputs}>${inputs}</sl-option>`
						})}
					</sl-select>
					<sl-select label="Function" size="small" value="plural">
						<sl-option value="plural">plural</sl-option>
					</sl-select>
					<div class="options-container">
						<p class="options-title">Plural Categories</p>
						<div class="options-wrapper">
							${this._getPluralCategories()?.map((category) => {
								return html`<sl-tag size="small" type="info">${category}</sl-tag>`
							})}
						</div>
					</div>
					<sl-button size="small" variant="primary">Add selector</sl-button>
				</div>
			</sl-dropdown>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-selector-configurator": InlangSelectorConfigurator
	}
}
