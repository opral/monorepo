import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js"
import type { MessageBundle, Message, Variant } from "@inlang/sdk/v2" // Import the types
import { messageBundleStyling } from "./inlang-message-bundle.styles.js"
import upsertVariant from "../helper/crud/variant/upsert.js"

import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)

@customElement("inlang-message-bundle")
export default class InlangMessageBundle extends LitElement {
	static override styles = [baseStyling, messageBundleStyling]

	@property({ type: Object })
	messageBundle: MessageBundle | undefined

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
				${this.messageBundle?.messages.map((message) => this._renderMessage(message))}
			</div>
		`
	}

	private _renderMessage(message: Message) {
		return html`
			<div class="message">
				<div class="language-container">
					<span>${message.locale}</span>
				</div>
				<div class="message-body">
					${message.selectors.length > 0
						? html`<div class="selector-container">
								${message.selectors.map(
									// @ts-ignore
									(selector) => html`<div class="selector">${selector.arg.name}</div>`
								)}
						  </div>`
						: ``}
					<div class="variants-container">
						${message.variants.map((variant) => this._renderVariant(variant, message))}
					</div>
				</div>
			</div>
		`
	}

	private _renderVariant(variant: Variant, message: Message) {
		// @ts-ignore
		const selectors = message.selectors.map((selector) => selector.arg.name)
		const matches = selectors.map((selector) => {
			const matchIndex = selectors.indexOf(selector)
			return variant.match[matchIndex] || ""
		})
		return html`
			<div class="variant">
				${matches.map((match) => html`<div class="match">${match}</div>`)}
				<sl-input
					class="pattern"
					size="small"
					value=${variant.pattern
						.map((p) => {
							if ("value" in p) {
								return p.value
							}
							return ""
						})
						.join(" ")}
				></sl-input>
				<div class="actions">
					<sl-button
						size="small"
						@click=${(e: Event) => {
							const target = e.target as HTMLInputElement
							// upsert variant
							upsertVariant({
								message: message,
								variant: {
									match: variant.match,
									pattern: [
										{
											type: "text",
											// @ts-ignore - just for prototyping
											value: target!.parentElement!.previousSibling!.previousSibling!.value,
										},
									],
								},
							})
							this._triggerSave()
						}}
						>Save</sl-button
					>
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
