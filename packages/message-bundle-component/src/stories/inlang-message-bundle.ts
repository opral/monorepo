import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js"
import type { MessageBundle, Message } from "@inlang/sdk/v2" // Import the types
import { messageBundleStyling } from "./inlang-message-bundle.styles.js"

import "./inlang-variant.js"
import "./inlang-lint-report-tip.js"

import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import type { MessageLintReport } from "@inlang/sdk"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)

@customElement("inlang-message-bundle")
export default class InlangMessageBundle extends LitElement {
	static override styles = [baseStyling, messageBundleStyling]

	@property({ type: Object })
	messageBundle: MessageBundle | undefined

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

	override async firstUpdated() {
		await this.updateComplete
		// override primitive colors to match the design system
		overridePrimitiveColors()
	}

	override render() {
		return html`
			<div class="header">
				<span># ${this.messageBundle?.id}</span>
				<span class="alias">@${this.messageBundle?.alias.default}</span>
			</div>
			<div class="messages-container">
				${this.messageBundle?.messages.map((message) =>
					this._renderMessage(
						message,
						this.lintReports?.filter((report) => report.languageTag === message.locale)
					)
				)}
			</div>
		`
	}

	private _renderMessage(message: Message, messageLintReports?: MessageLintReport[]) {
		return html`
			<div class="message">
				<div class="language-container">
					<span>${message.locale}</span>
				</div>
				<div class="message-body">
					${message.selectors.length > 0
						? html`<div class="message-header">
								<div class="selector-container">
									${message.selectors.map(
										// @ts-ignore
										(selector) => html`<div class="selector">${selector.arg.name}</div>`
									)}
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
						${message.variants.map(
							(variant) =>
								html`<inlang-variant
									.variant=${variant}
									.message=${message}
									.triggerSave=${this._triggerSave}
									.lintReports=${messageLintReports}
								></inlang-variant>`
						)}
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
