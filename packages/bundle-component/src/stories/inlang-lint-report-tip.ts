import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("inlang-lint-report-tip")
export default class InlangLintReportTip extends LitElement {
	static override styles = [
		css`
			.lint-report-tip {
				height: 29px;
				width: 29px;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 4px;
				cursor: pointer;
				color: var(--sl-input-color);
			}
			.lint-report-tip.error {
				color: var(--sl-color-danger-700);
			}
			.lint-report-tip.warning {
				color: var(--sl-color-warning-600);
			}
			.lint-report-tip:hover {
				background-color: var(--sl-input-background-color-hover);
			}
			.lint-report-tip.warning:hover {
				color: var(--sl-color-warning-700);
			}
			.dropdown-container {
				font-size: 13px;
				width: 240px;
				background-color: var(--sl-panel-background-color);
				border: 1px solid var(--sl-panel-border-color);
				border-radius: 6px;
				display: flex;
				flex-direction: column;
			}
			.dropdown-item {
				display: flex;
				flex-direction: row;
				gap: 12px;
				padding: 8px 12px;
				padding-bottom: 10px;
				border-top: 1px solid var(--sl-input-border-color);
			}
			.dropdown-item:first-child {
				border-top: none;
			}
			.report-icon {
				height: 29px;
				width: 29px;
				color: var(--sl-input-color);
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.report-icon.error {
				color: var(--sl-color-danger-700);
			}
			.report-icon.warning {
				color: var(--sl-color-warning-500);
			}
			.report-content {
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
			.report-title {
				padding-top: 2px;
				font-size: 12px;
				font-weight: 500;
				color: var(--sl-input-color);
			}
			.report-body {
				font-size: 12px;
				color: var(--sl-input-help-text-color);
				line-break: anywhere;
			}
			.report-fixes {
				display: flex;
				flex-direction: column;
				gap: 4px;
				padding-top: 4px;
			}
			.fix-button {
				width: 100%;
			}
			.fix-button::part(base) {
				color: var(--sl-input-color);
				background-color: var(--sl-input-background-color);
				border: 1px solid var(--sl-input-border-color);
			}
			.fix-button::part(base):hover {
				color: var(--sl-input-color-hover);
				background-color: var(--sl-input-background-color-hover);
				border: 1px solid var(--sl-input-border-color-hover);
			}
			p {
				margin: 0;
			}
		`,
	]

	//props
	@property()
	lintReports: any | undefined

	@property()
	installedLintRules: any | undefined

	@property()
	fixLint: (lintReport: any, fix: any) => void = () => {}

	//functions
	private _getLintReportLevelClass = () => {
		if (this.lintReports?.some((report: any) => report.level === "error")) {
			return "error"
		}
		if (this.lintReports?.some((report: any) => report.level === "warning")) {
			return "warning"
		}
		return ""
	}

	private _getLintDisplayName = (ruleId: string) => {
		const rule = this.installedLintRules?.find((rule: any) => rule.id === ruleId)

		if (typeof rule?.displayName === "string") {
			return rule.displayName
		} else if (typeof rule === "object") {
			return (rule?.displayName as { en: string }).en
		} else {
			return ruleId.split(".")[2]
		}
	}

	override render() {
		return html`<sl-dropdown
			distance="4"
			placement="bottom-start"
			class="dropdown"
			@sl-show=${(e: CustomEvent) => {
				//console.log(e)
			}}
		>
			<div slot="trigger" class=${"lint-report-tip " + this._getLintReportLevelClass()}>
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
			<div class="dropdown-container">
				${this.lintReports?.map((lintReport: any) => {
					return html`<div class="dropdown-item">
						<div class=${"report-icon " + lintReport.level}>
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
						<div class="report-content">
							<p class="report-title">${this._getLintDisplayName(lintReport.ruleId)}</p>
							<p class="report-body">${lintReport.body}</p>
							${lintReport.fixes && lintReport.fixes.length > 0
								? html`<div class="report-fixes">
										${lintReport.fixes?.map((fix: any) => {
											return html`
												<sl-button
													@click=${() => {
														this.fixLint(lintReport, fix.title)
													}}
													class="fix-button"
													size="small"
													>${fix.title}</sl-button
												>
											`
										})}
								  </div>`
								: ""}
						</div>
					</div>`
				})}
			</div>
		</sl-dropdown>`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-lint-report-tip": InlangLintReportTip
	}
}
