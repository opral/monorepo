import { html, LitElement, css } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import overridePrimitiveColors from "../helper/overridePrimitiveColors.js"
import type { MessageBundle, Message, Variant } from "@inlang/sdk/v2" // Import the types

@customElement("inlang-message-bundle")
export default class InlangMessageBundle extends LitElement {
	@property({ type: Object })
	messageBundle: MessageBundle | undefined

	static override styles = [
		baseStyling,
		css`
			.header {
				font-size: 16px;
				font-weight: bold;
				margin-bottom: 24px;
				background-color: #f5f5f5;
				padding: 10px;
				display: flex;
				justify-content: flex-start;
				align-items: baseline;
				gap: 10px;
				border-bottom: 1px solid #ddd;
			}
			.container {
				width: 100%;
				margin-bottom: 16px;
			}
			.section {
				border: 1px solid var(--border-color, #ccc);
				padding: 16px;
				border-radius: 8px;
				background-color: var(--background-color, #fff);
				margin-bottom: 16px;
			}
			.section-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-size: 14px;
				margin-bottom: 8px;
				background-color: #f5f5f5;
				padding: 10px;
				border-bottom: 1px solid #ddd;
			}
			.button {
				padding: 4px 8px;
				background-color: var(--button-bg-color, #007bff);
				color: var(--button-text-color, #fff);
				border: none;
				border-radius: 4px;
				cursor: pointer;
			}
			.input-group {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 8px;
				padding: 8px;
				background-color: #f9f9f9;
			}
			.input-group span {
				flex: 1;
			}
			.input-group input {
				flex: 3;
				margin-left: 8px;
			}
			table {
				width: 100%;
				border-collapse: collapse;
			}
			th,
			td {
				border: 1px solid var(--border-color, #ccc);
				padding: 8px;
			}
			th {
				background-color: var(--header-bg-color, #f0f0f0);
			}
			.variant-table {
				display: flex;
				border-collapse: collapse;
				margin-bottom: 16px;
			}
			.variant-table .lang {
				width: 100px;
				border: 1px solid #ccc;
				border-right: none;
				border-collapse: collapse;
				background-color: #f9f9f9;
				padding: 8px;
			}
			.variant-group {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 8px;
			}
			.variant-group input {
				flex: 1;
				margin-left: 8px;
			}
			.local-input,
			.selector {
				margin-top: 8px;
			}
			.alias {
				font-size: 12px;
				color: #666;
			}
			.new-variant {
				font-style: italic;
				color: #aaa;
				cursor: pointer;
			}
			.delete-button {
				background: none;
				border: none;
				color: red;
				cursor: pointer;
			}
			.input-count {
				display: flex;
				align-items: center;
			}
			.input-count span {
				margin-left: 8px;
				font-size: 12px;
			}
			.modal {
				display: flex;
				flex-direction: column;
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background-color: white;
				padding: 20px;
				box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
				z-index: 1000;
			}
			.modal select,
			.modal button {
				margin-bottom: 10px;
			}
			.overlay {
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.5);
				z-index: 999;
			}
		`,
	]

	override async firstUpdated() {
		await this.updateComplete
		// override primitive colors to match the design system
		overridePrimitiveColors()
	}

	private closeSelectorModal() {
		this.showSelectorModal = false
	}

	private saveSelector() {
		// Implement saving logic here
		this.closeSelectorModal()
	}

	override render() {
		return html`
			<div class="header">
				<span># ${this.messageBundle?.id}</span>
				<span class="alias">@${this.messageBundle?.alias.default}</span>
			</div>
			<div class="container">
				${this.messageBundle?.messages.map((message) => this.renderVariantsTable(message))}
			</div>
		`
	}

	private renderVariantsTable(message: Message) {
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
							this.renderVariantRow(variant, index, selectors)
						)}
					</tbody>
					<tfooter>
						<td colspan="${selectors.length + 2}">Add Variant</td>
					</tfooter>
				</table>
			</div>
		`
	}

	private renderVariantRow(variant: Variant, index: number, selectors: string[]) {
		const matches = selectors.map((selector) => {
			const matchIndex = selectors.indexOf(selector)
			return variant.match[matchIndex] || ""
		})
		return html`
			<tr>
				${matches.map((match) => html`<td>${match}</td>`)}
				<td>${variant.pattern.map((p) => p.value).join(" ")}</td>
				<td>
					<button class="delete-button" @click="${() => this.deleteVariant(index)}">🗑️</button>
				</td>
			</tr>
		`
	}

	private addVariant(locale: string) {
		const messageIndex = this.messageBundle?.messages.findIndex((msg) => msg.locale === locale)
		if (messageIndex !== undefined && messageIndex !== -1) {
			const newVariant: Variant = {
				match: [""],
				pattern: [{ type: "text", value: "" }],
			}
			this.messageBundle?.messages[messageIndex]?.variants.push(newVariant)
			this.requestUpdate()
		}
	}

	private deleteVariant(index: number) {
		for (const message of this.messageBundle?.messages) {
			if (message.variants[index]) {
				message.variants.splice(index, 1)
			}
		}
		this.requestUpdate()
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-message-bundle": InlangMessageBundle
	}
}
