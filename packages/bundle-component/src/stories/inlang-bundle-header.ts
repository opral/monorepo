import type { Declaration, Message, BundleNested, ProjectSettings, Variant } from "@inlang/sdk2"
import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import getInputs from "../helper/crud/input/get.js"
import deleteInput from "../helper/crud/input/delete.js"

@customElement("inlang-bundle-header")
export default class InlangBundleHeader extends LitElement {
	static override styles = [
		css`
			div {
				box-sizing: border-box;
				font-size: 13px;
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

	@property()
	bundle: BundleNested | undefined

	@property()
	settings: ProjectSettings | undefined

	@property()
	bundleValidationReports: Array<any> | undefined

	@property()
	addInput: (input: Declaration) => void = () => {}

	@property()
	triggerSave: () => void = () => {}

	@property()
	triggerRefresh: () => void = () => {}

	@state()
	private _hasActions: boolean = false

	dispatchOnUpdateMessage(message: Message, variants: Variant[]) {
		const onUpdateMessage = new CustomEvent("update-message", {
			bubbles: true,
			composed: true,
			detail: {
				argument: {
					message,
					variants,
				},
			},
		})
		this.dispatchEvent(onUpdateMessage)
	}

	private _inputs = (): Declaration[] | undefined => {
		return this.bundle ? getInputs({ messageBundle: this.bundle }) : undefined
	}

	override async firstUpdated() {
		await this.updateComplete
		this._hasActions = this.querySelector("[slot=bundle-action]") !== null
	}

	override render() {
		return html`
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
												><sl-button slot="trigger" class="input-tag" variant="neutral" size="small"
													>${input.name}</sl-button
												><sl-menu>
													<sl-menu-item
														value="delete"
														@click=${() => {
															deleteInput({ messageBundle: this.bundle!, input })
															this.requestUpdate()
															for (const message of this.bundle!.messages) {
																this.dispatchOnUpdateMessage(message, [])
															}
														}}
														>Delete</sl-menu-item
													>
												</sl-menu>
											</sl-dropdown>`
									)}
									<inlang-add-input
										.addInput=${(x: any) => {
											this.addInput(x)
											this.requestUpdate()
										}}
									>
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
								<inlang-add-input
									.addInput=${(x: any) => {
										this.addInput(x)
										this.requestUpdate()
									}}
								>
									<sl-tooltip content="Add input to message bundle">
										<sl-button class="text-button" variant="text" size="small"
											><svg
												viewBox="0 0 24 24"
												width="18"
												height="18"
												slot="prefix"
												style="margin-right: -2px"
											>
												<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path></svg
											>Input</sl-button
										>
									</sl-tooltip>
								</inlang-add-input>
						  </div>`}
					${this._hasActions
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
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-bundle-header": InlangBundleHeader
	}
}
