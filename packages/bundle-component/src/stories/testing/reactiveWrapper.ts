import { LitElement, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"

import "./../inlang-bundle.js"
import "./../actions/inlang-bundle-action.js"
import type { LintReport, MessageBundle, ProjectSettings2 } from "@inlang/sdk/v2"
import type { InstalledMessageLintRule } from "@inlang/sdk"
import { pluralBundle } from "@inlang/sdk/v2-mocks"
import {
	mockInstalledLintRules,
	mockMessageLintReports,
	mockVariantLintReports,
} from "../../mock/lint.js"
import { mockSettings } from "../../mock/settings.js"

@customElement("inlang-reactive-wrapper")
export default class InlangReactiveWrapper extends LitElement {
	@property({ type: Object })
	bundle: MessageBundle | undefined

	@property({ type: Object })
	settings: ProjectSettings2 | undefined

	@property({ type: Array })
	installedLintRules: InstalledMessageLintRule[] | undefined

	@state()
	_lintReports: { hash: string; reports: LintReport[] } | undefined

	//disable shadow root -> because of contenteditable selection API
	override createRenderRoot() {
		return this
	}

	override async firstUpdated() {
		this._lintReports = {
			hash: "hash",
			reports: [],
		}

		setInterval(() => {
			if (this._lintReports) {
				this._lintReports = {
					...this._lintReports,
					reports: [...mockMessageLintReports, ...mockVariantLintReports],
				}
			}
		}, 1900)

		// setInterval(() => {
		// 	if (this._lintReports) {
		// 		this._lintReports = {
		// 			...this._lintReports,
		// 			reports: [],
		// 		}
		// 	}
		// }, 3100)
	}

	override render() {
		return html`<inlang-bundle
			.bundle=${{ ...(this.bundle || pluralBundle), lintReports: this._lintReports }}
			.settings=${this.settings || mockSettings}
			.installedLintRules=${this.installedLintRules || mockInstalledLintRules}
			@change-message-bundle=${(data: any) => {
				this.bundle = data.detail.argument
			}}
			@fix-lint=${(data: any) => console.info("fixLint", data.detail.argument)}
		>
			<inlang-bundle-action
				actionTitle="Share"
				@click=${() => console.log("Share")}
			></inlang-bundle-action>
			<inlang-bundle-action
				actionTitle="Edit alias"
				@click=${() => console.log("Edit alias")}
			></inlang-bundle-action>
		</inlang-bundle> `
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"inlang-reactive-wrapper": InlangReactiveWrapper
	}
}
