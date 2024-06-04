import type { Variant, Message } from "@inlang/sdk/v2"
import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import upsertVariant from "../helper/crud/variant/upsert.js"
import type { MessageLintReport } from "@inlang/message-lint-rule"

import "./inlang-lint-report-tip.js"

@customElement("inlang-variant")
export default class InlangVariant extends LitElement {
	static override styles = [
		css`
			div {
				box-sizing: border-box;
				font-size: 13px;
			}
			:host {
				border-top: 1px solid var(--sl-color-neutral-300);
			}
			:host(:first-child) {
				border-top: none;
			}
			.variant {
				position: relative;
				min-height: 44px;
				width: 100%;
				display: flex;
				align-items: center;
			}
			.match {
				padding: 12px;
				height: 44px;
				width: 80px;
				background-color: var(--sl-color-neutral-100);
				border-right: 1px solid var(--sl-color-neutral-300);
			}
			.pattern {
				flex: 1;
				background-color: none;
				height: 44px;
			}
			.pattern::part(base) {
				border: none;
				border-radius: 0;
				min-height: 44px;
			}
			.pattern::part(input) {
				min-height: 44px;
			}
			.actions {
				position: absolute;
				top: 0;
				right: 0;
				height: 44px;
				display: flex;
				align-items: center;
				gap: 10px;
				padding-right: 12px;
			}
		`,
	]

	@property()
	message: Message | undefined

	@property()
	variant: Variant | undefined

	@property()
	lintReports: MessageLintReport[] | undefined

	@property()
	triggerSave: () => void = () => {}

	@state()
	private _pattern: string | undefined = undefined

	private get _selectors(): string[] | undefined {
		// @ts-ignore - just for prototyping
		return this.message ? this.message.selectors.map((selector) => selector.arg.name) : undefined
	}

	private get _matches(): string[] | undefined {
		// @ts-ignore - just for prototyping
		return this._selectors.map((selector) => {
			const matchIndex = this._selectors ? this._selectors.indexOf(selector) : undefined
			return this.variant && typeof matchIndex === "number" ? this.variant.match[matchIndex] : ""
		})
	}

	override render() {
		return html`<div class="variant">
			${this._matches
				? this._matches.map((match) => html`<div class="match">${match}</div>`)
				: undefined}
			${this.variant
				? html`<sl-input
						class="pattern"
						size="small"
						value=${this.variant.pattern
							.map((p) => {
								if ("value" in p) {
									return p.value
								}
								return ""
							})
							.join(" ")}
						@input=${(e: Event) => {
							this._pattern = (e.target as HTMLInputElement).value
						}}
				  ></sl-input>`
				: ``}
			<div class="actions">
				<sl-button
					size="small"
					@click=${() => {
						if (this.message && this.variant && this._pattern) {
							// upsert variant
							upsertVariant({
								message: this.message,
								variant: {
									match: this.variant.match,
									pattern: [
										{
											type: "text",
											value: this._pattern,
										},
									],
								},
							})
							this.triggerSave()
						}
					}}
					>Save</sl-button
				>
				${this.lintReports &&
				this.lintReports.length > 0 &&
				this.message?.selectors &&
				this.message.selectors.length === 0
					? html`<inlang-lint-report-tip .lintReports=${this.lintReports}></inlang-lint-report-tip>`
					: ``}
			</div>
		</div> `
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-variant": InlangVariant
	}
}
