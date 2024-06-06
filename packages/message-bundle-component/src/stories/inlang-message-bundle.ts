import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js"
import type { MessageBundle, Message, LanguageTag } from "@inlang/sdk/v2" // Import the types
import { messageBundleStyling } from "./inlang-message-bundle.styles.js"

import "./inlang-variant.js"
import "./inlang-lint-report-tip.js"
import "./inlang-selector-configurator.js"

import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js"
import type { MessageLintReport, ProjectSettings } from "@inlang/sdk"
import { getInputs } from "../helper/crud/input/get.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-tooltip")) customElements.define("sl-tooltip", SlTooltip)

@customElement("inlang-message-bundle")
export default class InlangMessageBundle extends LitElement {
	static override styles = [baseStyling, messageBundleStyling]

	@property({ type: Object })
	messageBundle: MessageBundle | undefined

	@property({ type: Object })
	settings: ProjectSettings | undefined

	@property({ type: Object })
	lintReports: MessageLintReport[] | undefined

	dispatchOnSetSettings(messageBundle: MessageBundle) {
		const onChangeMessageBundle = new CustomEvent("change-message-bundle", {
			detail: {
				argument: messageBundle,
			},
		})
		this.dispatchEvent(onChangeMessageBundle)
	}

	_triggerSave = () => {
		if (this.messageBundle) {
			this.dispatchOnSetSettings(this.messageBundle)
		}
	}

	_addMessage = (message: Message) => {
		if (this.messageBundle) {
			this.messageBundle.messages.push(message)
			this.requestUpdate()
		}
	}

	override async firstUpdated() {
		await this.updateComplete
		// override primitive colors to match the design system
		overridePrimitiveColors()
	}

	private _refLanguageTag = (): LanguageTag | undefined => {
		return this.settings?.sourceLanguageTag
	}

	private _languageTags = (): LanguageTag[] | undefined => {
		return this.settings?.languageTags
	}

	private _fakeInputs = (): string[] | undefined => {
		const _refLanguageTag = this._refLanguageTag()
		return _refLanguageTag && this.messageBundle
			? getInputs({ messageBundle: this.messageBundle })
			: undefined
	}

	override render() {
		return html`
			<div class="header">
				<span># ${this.messageBundle?.id}</span>
				<span class="alias">@${this.messageBundle?.alias.default}</span>
			</div>
			<div class="messages-container">
				${this._languageTags() &&
				this._languageTags()?.map((languageTag) => {
					const message = this.messageBundle?.messages.find(
						(message) => message.locale === languageTag
					)

					return this._renderMessage(
						languageTag,
						message,
						this.lintReports?.filter((report) => report.languageTag === languageTag)
					)
				})}
			</div>
		`
	}

	private _renderMessage(
		languageTag: LanguageTag,
		message?: Message,
		messageLintReports?: MessageLintReport[]
	) {
		return html`
			<div class="message">
				<div class="language-container">
					<span>${languageTag}</span>
				</div>
				<div class="message-body">
					${message && message.selectors.length > 0
						? html`<div class="message-header">
								<div class="selector-container">
									${message.selectors.map(
										// @ts-ignore
										(selector) => html`<div class="selector">${selector.arg.name}</div>`
									)}
									<div class="add-selector-container">
										<inlang-selector-configurator .inputs=${this._fakeInputs()} .message=${message}>
											<sl-tooltip content="Add Selector to message"
												><div class="add-selector">
													<svg
														viewBox="0 0 24 24"
														width="18"
														height="18"
														slot="prefix"
														class="w-5 h-5 -mx-1"
													>
														<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path>
													</svg>
												</div>
											</sl-tooltip>
										</inlang-selector-configurator>
									</div>
								</div>
								<div class="message-actions">
									${messageLintReports && messageLintReports.length > 0
										? html`<inlang-lint-report-tip
												.lintReports=${messageLintReports}
										  ></inlang-lint-report-tip>`
										: ``}
								</div>
						  </div>`
						: ``}
					<div class="variants-container">
						${message
							? message.variants.map(
									(variant) =>
										html`<inlang-variant
											.variant=${variant}
											.message=${message}
											.inputs=${this._fakeInputs()}
											.triggerSave=${this._triggerSave}
											.addMessage=${this._addMessage}
											.languageTag=${languageTag}
											.lintReports=${messageLintReports}
										></inlang-variant>`
							  )
							: html`<inlang-variant
									.message=${message}
									.inputs=${this._fakeInputs()}
									.triggerSave=${this._triggerSave}
									.addMessage=${this._addMessage}
									.languageTag=${languageTag}
									.lintReports=${messageLintReports}
							  ></inlang-variant>`}
					</div>
				</div>
			</div>
		`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-message-bundle": InlangMessageBundle
	}
}
