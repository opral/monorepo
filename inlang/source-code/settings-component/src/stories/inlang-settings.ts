import { html, LitElement, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import {
	type InlangModule,
	ProjectSettings,
	type InlangProject,
	type InstalledPlugin,
	type InstalledMessageLintRule,
} from "@inlang/sdk"

import "./input-fields/general-input.js"

import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js"
import SLOption from "@shoelace-style/shoelace/dist/components/option/option.component.js"
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlCheckbox from "@shoelace-style/shoelace/dist/components/checkbox/checkbox.component.js"
import SlIconButton from "@shoelace-style/shoelace/dist/components/icon-button/icon-button.component.js"
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js"

import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js"
setBasePath("./../../../../node_modules/@shoelace-style/shoelace/dist")

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-select")) customElements.define("sl-select", SlSelect)
if (!customElements.get("sl-option")) customElements.define("sl-option", SLOption)
if (!customElements.get("sl-input")) customElements.define("sl-input", SlInput)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)
if (!customElements.get("sl-checkbox")) customElements.define("sl-checkbox", SlCheckbox)
if (!customElements.get("sl-icon-button")) customElements.define("sl-icon-button", SlIconButton)
if (!customElements.get("sl-icon")) customElements.define("sl-icon", SlIcon)

@customElement("inlang-settings")
export default class InlangSettings extends LitElement {
	static override styles = [
		baseStyling,
		css`
			h3 {
				margin: 0;
			}
			.container {
				position: relative;
				display: flex;
				flex-direction: column;
				gap: 48px;
			}
			.module-container {
				display: flex;
				flex-direction: column;
				gap: 16px;
			}
			.hover-bar-container {
				width: 100%;
				box-sizing: border-box;
				position: sticky;
				bottom: 1rem;
			}
			.hover-bar {
				box-sizing: border-box;
				width: 100%;
				max-width: 600px;
				margin: 0 auto;
				display: flex;
				flex-wrap: wrap;
				justify-content: space-between;
				align-items: center;
				gap: 8px;
				background-color: var(--sl-panel-background-color);
				padding: 0.8rem;
				padding-left: 1rem;
				border-radius: 0.5rem;
				border: 1px solid var(--sl-panel-border-color);
				filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));
			}
			.hover-bar-text {
				font-weight: 500;
				margin: 0;
			}
		`,
	]

	@property({ attribute: false })
	project: InlangProject = {} as InlangProject

	@state()
	private _newSettings: ProjectSettings | undefined = undefined

	@state()
	private _unsavedChanges: boolean = false

	override async firstUpdated() {
		await this.updateComplete

		if (this.project?.settings()) {
			this._newSettings = JSON.parse(JSON.stringify(this.project.settings()))
		}
	}

	handleInlangProjectChange = (
		//value needs to be exactly how it goes in the project settings json
		value: string,
		property: string,
		moduleId?: InlangModule["default"]["id"]
	) => {
		//update state object
		if (this._newSettings && moduleId) {
			this._newSettings = {
				...this._newSettings,
				[moduleId]: {
					...this._newSettings[moduleId],
					[property]: value,
				},
			}
		} else if (this._newSettings) {
			this._newSettings = {
				...this._newSettings,
				[property]: value,
			}
		}
		if (JSON.stringify(this.project?.settings()) !== JSON.stringify(this._newSettings)) {
			this._unsavedChanges = true
		} else {
			this._unsavedChanges = false
		}
	}

	_revertChanges = () => {
		if (this.project?.settings()) {
			this._newSettings = JSON.parse(JSON.stringify(this.project?.settings()))
		}
		this._unsavedChanges = false
	}

	_saveChanges = () => {
		if (this._newSettings) {
			this.project?.setSettings(this._newSettings)
		}
		this._unsavedChanges = false
	}

	private get _projectSettingProperties(): Record<
		InlangModule["default"]["id"] | "internal",
		{
			meta?: InstalledPlugin | InstalledMessageLintRule
			schema?: Record<string, Record<string, unknown>>
		}
	> {
		const _project = this.project
		if (!_project) throw new Error("No inlang project")
		if (!_project.settings()) throw new Error("No inlang project settings")

		const generalSchema: Record<
			InlangModule["default"]["id"] | "internal",
			{
				meta?: InstalledPlugin | InstalledMessageLintRule
				schema?: Record<string, Record<string, unknown>>
			}
		> = { internal: { schema: ProjectSettings.allOf[0] } }

		for (const plugin of _project.installed.plugins()) {
			if (plugin.settingsSchema) {
				generalSchema[plugin.id] = {
					schema: plugin.settingsSchema,
					meta: plugin,
				}
			}
		}
		for (const lintRule of _project.installed.messageLintRules()) {
			if (lintRule.settingsSchema) {
				generalSchema[lintRule.id] = {
					schema: lintRule.settingsSchema,
					meta: lintRule,
				}
			}
		}

		return generalSchema
	}

	override render() {
		return html` <div class="container">
			${Object.entries(this._projectSettingProperties).map(([key, value]) => {
				return value.schema?.properties && this._newSettings
					? html`<div class="module-container">
							${value.meta &&
							(value.meta?.displayName as { en: string }).en &&
							html`<h3>${value.meta && (value.meta?.displayName as { en: string }).en}</h3>`}
							${Object.entries(value.schema.properties).map(([property, schema]) => {
								if (property === "$schema" || property === "modules" || property === "experimental")
									return undefined
								return key === "internal"
									? html`
											<general-input
												.property=${property}
												.modules=${this.project.installed.messageLintRules() || []}
												.value=${this._newSettings?.[property as keyof typeof this._newSettings]}
												.schema=${schema}
												.handleInlangProjectChange=${this.handleInlangProjectChange}
											></general-input>
									  `
									: html`
											<general-input
												.property=${property}
												.value=${
													// @ts-ignore
													this._newSettings?.[key]?.[property]
												}
												.schema=${schema}
												.moduleId=${key}
												.handleInlangProjectChange=${this.handleInlangProjectChange}
											></general-input>
									  `
							})}
					  </div>`
					: undefined
			})}
			${this._unsavedChanges
				? html`<div class="hover-bar-container">
						<div class="hover-bar">
							<p class="hover-bar-text">Attention, you have unsaved changes.</p>
							<div>
								<sl-button
									size="medium"
									@click=${() => {
										this._revertChanges()
									}}
									varaint="default"
								>
									Cancel
								</sl-button>
								<sl-button
									size="medium"
									@click=${() => {
										this._saveChanges()
									}}
									variant="primary"
								>
									Save Changes
								</sl-button>
							</div>
						</div>
				  </div>`
				: html``}
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-settings": InlangSettings
	}
}
