import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js"
import type { MessageBundle, Message, Variant } from "@inlang/sdk/v2" // Import the types
import { messageBundleStyling } from "./inlang-message-bundle.styles.js"
import upsertVariant from "../helper/crud/variant/upsert.js"

@customElement("inlang-message-bundle")
export default class InlangMessageBundle extends LitElement {
	static override styles = [baseStyling, messageBundleStyling]

	@property({ type: Object })
	messageBundle: MessageBundle | undefined

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
			<div
				@click=${() => {
					// upsert variant
					upsertVariant({
						message: this.messageBundle!.messages[0]!,
						variant: { match: ["other"], pattern: [{ type: "text", value: "Hello World!" }] },
					})
					this.requestUpdate()
				}}
			>
				Add test variant
			</div>
			<div
				@click=${() => {
					// upsert variant
					upsertVariant({
						message: this.messageBundle!.messages[0]!,
						variant: { match: ["other"], pattern: [{ type: "text", value: "Show me a lot." }] },
					})
					this.requestUpdate()
				}}
			>
				Update test variant
			</div>
			<div @click=${() => console.log(this.messageBundle)}>Log message bundle</div>
			<div class="container">
				${this.messageBundle?.messages.map((message) => this.renderVariantsTable(message))}
			</div>
		`
	}

	private renderVariantsTable(message: Message) {
		// @ts-ignore
		const selectors = message.selectors.map((selector) => selector.arg.name)
		return html`
			<div class="variant-table">
				<div class="lang">
					<span>${message.locale}</span>
				</div>
				<table>
					<thead>
						<tr>
							${selectors.map((selector) => html`<th>${selector}</th>`)}
							<th>Pattern</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						${message.variants.map((variant, index) =>
							this.renderVariantRow(variant, index, selectors, message)
						)}
					</tbody>
					<tfooter>
						<td colspan="${selectors.length + 2}">Add Variant</td>
					</tfooter>
				</table>
			</div>
		`
	}

	private renderVariantRow(variant: Variant, index: number, selectors: string[], message: Message) {
		const matches = selectors.map((selector) => {
			const matchIndex = selectors.indexOf(selector)
			return variant.match[matchIndex] || ""
		})
		return html`
			<tr>
				${matches.map((match) => html`<td>${match}</td>`)}
				<td>
					<input
						type="text"
						value=${variant.pattern
							.map((p) => {
								if ("value" in p) {
									return p.value
								}
								return ""
							})
							.join(" ")}
					/>
					<div
						@click=${(e: Event) => {
							const target = e.target as HTMLInputElement
							// upsert variant
							upsertVariant({
								message: message,
								variant: {
									match: variant.match,
									pattern: [
										// @ts-ignore
										{ type: "text", value: target!.previousSibling!.previousSibling!.value },
									],
								},
							})
							this.requestUpdate()
						}}
					>
						Save
					</div>
				</td>
				<td>
					<button
						class="delete-button"
						@click="${() => {
							// eslint-disable-next-line no-console
							console.log("delete variant", index)
						}}"
					>
						🗑️
					</button>
				</td>
			</tr>
		`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-message-bundle": InlangMessageBundle
	}
}
