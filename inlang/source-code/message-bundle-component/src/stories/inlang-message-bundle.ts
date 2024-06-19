import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js"
import { type MessageBundle, type Message, type LanguageTag, createVariant } from "@inlang/sdk/v2" // Import the types
import { messageBundleStyling } from "./inlang-message-bundle.styles.js"
import upsertVariant from "../helper/crud/variant/upsert.js"

import "./inlang-variant.js"
import "./inlang-lint-report-tip.js"
import "./inlang-selector-configurator.js"

import SlTag from "@shoelace-style/shoelace/dist/components/tag/tag.component.js"
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlTooltip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js"
import type { MessageLintReport, ProjectSettings } from "@inlang/sdk"
import { getInputs } from "../helper/crud/input/get.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-tag")) customElements.define("sl-tag", SlTag)
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

	@property({ type: Array })
	lintReports: MessageLintReport[] | undefined

	dispatchOnSetSettings(messageBundle: MessageBundle) {
		const onChangeMessageBundle = new CustomEvent("change-message-bundle", {
			bubbles: true,
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

	_triggerRefresh = () => {
		this.requestUpdate()
	}

	override async firstUpdated() {
		await this.updateComplete
		// override primitive colors to match the design system
		overridePrimitiveColors()
	}

	private _refLocale = (): LanguageTag | undefined => {
		return this.settings?.sourceLanguageTag
	}

	private _locales = (): LanguageTag[] | undefined => {
		return this.settings?.languageTags
	}

	private _fakeInputs = (): string[] | undefined => {
		const _refLanguageTag = this._refLocale()
		return _refLanguageTag && this.messageBundle
			? getInputs({ messageBundle: this.messageBundle })
			: undefined
	}

	override render() {
		return html`
			<div class=${`header`}>
				<span># ${this.messageBundle?.id}</span>
				<span class="alias">@${this.messageBundle?.alias?.default}</span>
			</div>
			<div class="messages-container">
				${this._locales() &&
				this._locales()?.map((locale) => {
					const message = this.messageBundle?.messages.find((message) => message.locale === locale)

					return this._renderMessage(
						locale,
						message,
						this.lintReports?.filter((report) => report.languageTag === locale)
					)
				})}
			</div>
		`
	}

	private _renderMessage(
		locale: LanguageTag,
		message?: Message,
		messageLintReports?: MessageLintReport[]
	) {
		return html`
			<div class="message">
				<div class="language-container">
					<span>${locale}</span>
					${this._refLocale() === locale
						? html`<sl-tag size="small" variant="neutral">ref</sl-tag>`
						: ``}
				</div>
				<div class="message-body">
					${message && message.selectors.length > 0
						? html`<div
								class=${`message-header` +
								` ` +
								(message.variants && message.variants.length === 0 ? `no-bottom-border` : ``)}
						  >
								<div class="selector-container">
									${message.selectors.map(
										// @ts-ignore
										(selector) => html`<div class="selector">${selector.arg.name}</div>`
									)}
									<div class="add-selector-container">
										<inlang-selector-configurator
											.inputs=${this._fakeInputs()}
											.message=${message}
											.locale=${locale}
											.triggerMessageBundleRefresh=${this._triggerRefresh}
											.addMessage=${this._addMessage}
										>
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
											.triggerMessageBundleRefresh=${this._triggerRefresh}
											.addMessage=${this._addMessage}
											.locale=${locale}
											.lintReports=${messageLintReports}
										></inlang-variant>`
							  )
							: html`<inlang-variant
									.message=${message}
									.inputs=${this._fakeInputs()}
									.triggerSave=${this._triggerSave}
									.addMessage=${this._addMessage}
									.triggerMessageBundleRefresh=${this._triggerRefresh}
									.locale=${locale}
									.lintReports=${messageLintReports}
							  ></inlang-variant>`}
						${message?.selectors && message.selectors.length > 0
							? html`<p
									@click=${() => {
										upsertVariant({
											message: message,
											variant: createVariant({
												// combine the matches that are already present with the new category -> like a matrix
												match: message.selectors.map(() => "null"),
											}),
										})
										this._triggerSave()
										this._triggerRefresh()
									}}
									class="new-variant"
							  >
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										slot="prefix"
										class="w-5 h-5 -mx-1"
									>
										<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path>
									</svg>
									New variant
							  </p>`
							: ``}
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
