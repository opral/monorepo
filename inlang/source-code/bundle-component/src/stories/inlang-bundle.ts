import { css, html, LitElement } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js"
import { type Message, type Declaration } from "@inlang/sdk2"
import type { Bundle } from "@inlang/sdk2"
import { createChangeEvent } from "../helper/event.js"

// //shoelace components
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js"
import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.component.js"
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js"

// // in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-dropdown")) customElements.define("sl-dropdown", SlDropdown)
if (!customElements.get("sl-menu")) customElements.define("sl-menu", SlMenu)
if (!customElements.get("sl-menu-item")) customElements.define("sl-menu-item", SlMenuItem)

//components
import "./actions/inlang-add-input.js"

//helpers
import getInputs from "../helper/crud/input/get.js"
import { baseStyling } from "../styling/base.js"

@customElement("inlang-bundle")
export default class InlangBundle extends LitElement {
	static override styles = [
		baseStyling,
		css`
			div {
				box-sizing: border-box;
				font-size: 14px;
			}
			.header {
				display: flex;
				justify-content: space-between;
				background-color: var(--sl-color-neutral-300);
				padding: 0 12px;
				min-height: 44px;
			}
			.header-left {
				font-weight: 600;
				display: flex;
				align-items: center;
				gap: 16px;
				min-height: 44px;
				color: var(--sl-input-color);
			}
			.header-right {
				display: flex;
				align-items: center;
				gap: 12px;
				min-height: 44px;
			}
			.separator {
				height: 20px;
				width: 1px;
				background-color: var(--sl-input-border-color-hover);
				opacity: 0.7;
				border-radius: 1px;
			}
			.slotted-menu-wrapper {
				display: flex;
				flex-direction: column;
			}
			.inputs-wrapper {
				display: flex;
				align-items: center;
				min-height: 44px;
				gap: 8px;
				color: var(--sl-input-color);
			}
			.inputs {
				display: flex;
				align-items: center;
				min-height: 44px;
				gap: 1px;
			}
			.input-tag::part(base) {
				height: 28px;
				font-weight: 500;
				cursor: pointer;
			}
			.text-button::part(base) {
				background-color: transparent;
				border: 1px solid transparent;
			}
			.text-button::part(base):hover {
				background-color: var(--sl-panel-border-color);
				border: 1px solid transparent;
				color: var(--sl-input-color-hover);
			}
			.alias-wrapper {
				display: flex;
				align-items: center;
				gap: 8px;
			}
			.alias {
				font-weight: 400;
				color: var(--sl-input-placeholder-color);
			}
			.alias-counter {
				height: 20px;
				width: 24px;
				font-weight: 500;
				font-size: 11px;
				color: var(--sl-input-color-hover);
				padding: 4px;
				border-radius: 4px;
				background-color: var(--sl-input-background-color-hover);
				display: flex;
				align-items: center;
				justify-content: center;
			}
			sl-button::part(base) {
				background-color: var(--sl-input-background-color);
				color: var(--sl-input-color);
				border: 1px solid var(--sl-input-border-color);
				font-size: 13px;
			}
			sl-button::part(base):hover {
				background-color: var(--sl-input-background-color-hover);
				color: var(--sl-input-color-hover);
				border: 1px solid var(--sl-input-border-color-hover);
			}
			sl-menu-item::part(label) {
				font-size: 14px;
				padding-left: 12px;
			}
			sl-menu-item::part(base) {
				color: var(--sl-input-color);
			}
			sl-menu-item::part(base):hover {
				background-color: var(--sl-input-background-color-hover);
			}
			sl-menu-item::part(checked-icon) {
				display: none;
			}
			.selector:hover {
				background-color: var(--sl-input-background-color-hover);
			}
		`,
	]
	//props
	@property({ type: Object })
	bundle: Bundle | undefined

	@property({ type: Array })
	messages: Message[] | undefined

	@state()
	private _bundleActionsPresent = false

	private _inputs = (): Declaration[] | undefined => {
		return this.messages ? getInputs({ messages: this.messages }) : undefined
	}

	override async firstUpdated() {
		await this.updateComplete

		// @ts-ignore
		if ([...this.children].some((child: Element) => child.tagName === "INLANG-BUNDLE-ACTION")) {
			this._bundleActionsPresent = true
		}

		// override primitive colors to match the design system
		overridePrimitiveColors()
	}

	override render() {
		return html`
			<div>
				<div class=${`header`} part="base">
					<div class="header-left">
						<span># ${this.bundle?.id}</span>
						${this.bundle?.alias && Object.keys(this.bundle.alias).length > 0
							? html` <div class="alias-wrapper">
									<span class="alias">Alias: ${this.bundle?.alias?.default}</span>
									${Object.keys(this.bundle.alias).length > 1
										? html`<div class="alias-counter">
												+${Object.keys(this.bundle.alias).length - 1}
										  </div>`
										: ``}
							  </div>`
							: ``}
					</div>

					<div class="header-right">
						${this._inputs() && this._inputs()!.length > 0
							? html`<div class="inputs-wrapper">
									Inputs:
									<div class="inputs">
										${this._inputs()?.map(
											(input) =>
												html`<sl-dropdown
													><sl-button
														slot="trigger"
														class="input-tag"
														variant="neutral"
														size="small"
														>${input.name}</sl-button
													><sl-menu>
														<sl-menu-item
															value="delete"
															@click=${() => {
																for (const message of this.messages!) {
																	const newMessage = structuredClone(message)
																	const index = newMessage.declarations.findIndex(
																		(declaration) => declaration.name === input.name
																	)
																	newMessage.declarations.splice(index, 1)
																	this.dispatchEvent(
																		createChangeEvent({
																			type: "Message",
																			operation: "update",
																			newData: newMessage,
																		})
																	)
																}
															}}
															>Delete</sl-menu-item
														>
													</sl-menu>
												</sl-dropdown>`
										)}
										<inlang-add-input .messages=${this.messages}>
											<sl-tooltip content="Add input to message bundle">
												<sl-button class="text-button" variant="neutral" size="small"
													><svg
														viewBox="0 0 24 24"
														width="18"
														height="18"
														style="margin: 0 -2px"
														slot="prefix"
													>
														<path
															fill="currentColor"
															d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"
														></path></svg
												></sl-button>
											</sl-tooltip>
										</inlang-add-input>
									</div>
							  </div>`
							: html`<div class="inputs-wrapper">
									<inlang-add-input .messages=${this.messages}>
										<sl-tooltip content="Add input to message bundle">
											<sl-button class="text-button" variant="text" size="small"
												><svg
													viewBox="0 0 24 24"
													width="18"
													height="18"
													slot="prefix"
													style="margin-right: -2px"
												>
													<path
														fill="currentColor"
														d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"
													></path></svg
												>Input</sl-button
											>
										</sl-tooltip>
									</inlang-add-input>
							  </div>`}
						${this._bundleActionsPresent
							? html`<div class="separator"></div>
									<sl-dropdown class="bundle-actions">
										<sl-button class="text-button" variant="text" size="small" slot="trigger"
											><svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												viewBox="0 0 24 24"
												slot="prefix"
												style="margin: 0 -2px"
											>
												<path
													fill="currentColor"
													d="M7 12a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0"
												/></svg
										></sl-button>
										<sl-menu>
											<slot name="bundle-action"></slot>
										</sl-menu>
									</sl-dropdown>`
							: ``}
					</div>
				</div>
				<slot name="message"></slot>
				<!-- TODO: workaround for slot needs a better solution -->
				<slot name="bundle-action"></slot>
			</div>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-bundle": InlangBundle
	}
}
