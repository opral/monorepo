import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { createChangeEvent } from "../../../helper/event.js"
import type { Bundle } from "@inlang/sdk2"
import { baseStyling } from "../../../styling/base.js"

import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js"
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"

if (!customElements.get("sl-dropdown")) customElements.define("sl-dropdown", SlDropdown)
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)

@customElement("inlang-add-input")
export default class InlangAddInput extends LitElement {
	static override styles = [
		baseStyling,
		css`
			.button-wrapper {
				height: 44px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.dropdown-container {
				font-size: 13px;
				width: 240px;
				background-color: var(--sl-panel-background-color);
				border: 1px solid var(--sl-input-border-color);
				padding: 12px;
				border-radius: 6px;
				display: flex;
				flex-direction: column;
				gap: 16px;
			}
			.dropdown-item {
				display: flex;
				flex-direction: column;
				gap: 2px;
			}
			.dropdown-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				color: var(--sl-input-color);
				font-size: 12px;
			}
			.dropdown-title {
				font-size: 12px;
				font-weight: 500;
				margin: 6px 0;
			}
			.help-text {
				display: flex;
				gap: 8px;
				color: var(--sl-input-help-text-color);
			}
			.help-text p {
				flex: 1;
				margin: 0;
				font-size: 12px;
				line-height: 1.5;
			}
			.actions {
				width: 100%;
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
		`,
	]

	@property({ type: Object })
	bundle: Bundle

	//state
	@state()
	private _newInput: string | undefined

	override async firstUpdated() {
		await this.updateComplete
		this._newInput = ""
	}

	override render() {
		return html`
			<sl-dropdown
				distance="-4"
				class="dropdown"
				@sl-show=${(e: CustomEvent) => {
					const dropdown = this.shadowRoot?.querySelector("sl-dropdown")
					if (dropdown && e.target === dropdown) {
						const input: SlInput | undefined | null = this.shadowRoot?.querySelector("sl-input")
						setTimeout(() => {
							if (input) input.focus()
						})
					}
				}}
			>
				<div slot="trigger" class="button-wrapper">
					<slot></slot>
				</div>
				<div class="dropdown-container">
					<div class="dropdown-item">
						<div class="dropdown-header">
							<p class="dropdown-title">Add input</p>
						</div>
						<sl-input
							size="small"
							value=${this._newInput}
							placeholder="Enter name"
							@input=${(e: Event) => {
								this._newInput = (e.target as HTMLInputElement).value
							}}
							@keydown=${(e: KeyboardEvent) => {
								if (e.key === "Enter") {
									if (this._newInput && this._newInput.trim() !== "") {
										this.dispatchEvent(
											createChangeEvent({
												type: "Bundle",
												operation: "update",
												newData: {
													...this.bundle,
													declarations: [
														...this.bundle.declarations,
														{
															name: this._newInput,
															type: "input-variable",
														},
													],
												},
											})
										)
									}

									this._newInput = ""

									const dropdown = this.shadowRoot?.querySelector(".dropdown") as SlDropdown
									dropdown.hide()
								}
							}}
							><svg
								slot="suffix"
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
							>
								<path
									fill="currentColor"
									d="M19 6a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H7.41l1.3-1.29a1 1 0 0 0-1.42-1.42l-3 3a1 1 0 0 0-.21.33a1 1 0 0 0 0 .76a1 1 0 0 0 .21.33l3 3a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42L7.41 14H17a3 3 0 0 0 3-3V7a1 1 0 0 0-1-1"
								/></svg
						></sl-input>
					</div>
					<div class="help-text">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24px"
							height="24px"
							viewBox="0 0 256 256"
						>
							<path
								fill="currentColor"
								d="M140 180a12 12 0 1 1-12-12a12 12 0 0 1 12 12M128 72c-22.06 0-40 16.15-40 36v4a8 8 0 0 0 16 0v-4c0-11 10.77-20 24-20s24 9 24 20s-10.77 20-24 20a8 8 0 0 0-8 8v8a8 8 0 0 0 16 0v-.72c18.24-3.35 32-17.9 32-35.28c0-19.85-17.94-36-40-36m104 56A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104m-16 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"
							/>
						</svg>
						<p>As soon as added this input can be used in all messages of the bundle.</p>
					</div>
				</div>
			</sl-dropdown>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-add-input": InlangAddInput
	}
}
