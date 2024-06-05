import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import type { MessageLintReport } from "@inlang/message-lint-rule"

import SlToolTip from "@shoelace-style/shoelace/dist/components/tooltip/tooltip.component.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-tooltip")) customElements.define("sl-tooltip", SlToolTip)

@customElement("inlang-lint-report-tip")
export default class InlangLintReportTip extends LitElement {
	static override styles = [
		css`
			.lint-report-tip {
				height: 29px;
				width: 29px;
				color: var(--sl-color-danger-700);
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 4px;
			}
			.lint-report-tip:hover {
				background-color: var(--sl-color-danger-200);
			}
		`,
	]

	@property()
	lintReports: MessageLintReport[] | undefined

	override render() {
		return html`<sl-tooltip content=${JSON.stringify(this.lintReports)}>
			<div class="lint-report-tip">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						d="M9 13h2v2H9v-2zm0-8h2v6H9V5zm1-5C4.47 0 0 4.5 0 10A10 10 0 1010 0zm0 18a8 8 0 110-16 8 8 0 010 16z"
					></path>
				</svg>
			</div> 
		</div>`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-lint-report-tip": InlangLintReportTip
	}
}
