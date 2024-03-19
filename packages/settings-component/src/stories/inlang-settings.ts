import { html, LitElement, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import { type InlangModule, ProjectSettings, type InlangProject } from "@inlang/sdk"
import { Task } from "@lit/task"

import "./input-fields/simple-input.js"

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
				padding-bottom: 24px;
				border-bottom: 1px solid var(--sl-panel-border-color);
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
				gap: 24px;
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
	private _newProject: ProjectSettings | undefined = undefined

	@state()
	private _unsavedChanges: boolean = false

	override async firstUpdated() {
		await this.updateComplete

		if (this.project?.settings()) {
			this._newProject = JSON.parse(JSON.stringify(this.project.settings()))
		}
	}

	handleInlangProjectChange = (
		//value needs to be exactly how it goes in the project settings json
		value: string,
		property: string,
		moduleId?: InlangModule["default"]["id"]
	) => {
		//update state object
		if (this._newProject && moduleId) {
			this._newProject = {
				...this._newProject,
				[moduleId]: {
					...this._newProject[moduleId],
					[property]: value,
				},
			}
		} else if (this._newProject) {
			this._newProject = {
				...this._newProject,
				[property]: value,
			}
		}
		if (JSON.stringify(this.project?.settings()) !== JSON.stringify(this._newProject)) {
			this._unsavedChanges = true
		} else {
			this._unsavedChanges = false
		}
	}

	_revertChanges = () => {
		if (this.project?.settings()) {
			this._newProject = JSON.parse(JSON.stringify(this.project?.settings()))
		}
		this._unsavedChanges = false
	}

	_saveChanges = () => {
		if (this._newProject) {
			this.project?.setSettings(this._newProject)
		}
		this._unsavedChanges = false
	}

	private _projectProperties = new Task(this, {
		task: async ([project]) => {
			const _project = project
			if (!_project) throw new Error("No inlang project")
			if (!_project.settings()) throw new Error("No inlang project")

			const generalSchema: Record<
				InlangModule["default"]["id"] | "internal",
				{ meta?: InlangModule["default"]; schema?: Record<string, Record<string, unknown>> }
			> = { internal: { schema: ProjectSettings.allOf[0] } }

			for (const plugin of _project.installed.plugins()) {
				try {
					const importedPlugin = await import(plugin.module)
					if (importedPlugin.default) {
						generalSchema[importedPlugin.default.id] = {
							schema: importedPlugin.default.settingsSchema,
							meta: importedPlugin.default,
						}
					}
				} catch (e) {
					console.error(e)
				}
			}
			for (const lintRule of _project.installed.messageLintRules()) {
				try {
					const importedLintRule = await import(lintRule.module)
					if (importedLintRule.default) {
						generalSchema[importedLintRule.default.id] = {
							schema: importedLintRule.default.settingsSchema,
							meta: importedLintRule.default,
						}
					}
				} catch (e) {
					console.error(e)
				}
			}

			return generalSchema
		},
		args: () => [this.project],
	})

	override render() {
		return this._projectProperties.render({
			pending: () => html`<div>Loading...</div>`,
			complete: (properties) =>
				html` <div class="container">
					${Object.entries(properties).map(([key, value]) => {
						return value.schema?.properties && this._newProject
							? html`<div class="module-container">
									<h3>
										${(value.meta as { displayName?: { en: string } })?.displayName?.en || key}
									</h3>
									${Object.entries(value.schema.properties).map(([property, schema]) => {
										if (
											property === "$schema" ||
											property === "modules" ||
											property === "experimental"
										)
											return undefined
										return key === "internal"
											? html`
													<simple-input
														.property=${property}
														.modules=${properties}
														.value=${this._newProject?.[property as keyof typeof this._newProject]}
														.schema=${schema}
														.handleInlangProjectChange=${this.handleInlangProjectChange}
													></simple-input>
											  `
											: html`
													<simple-input
														.property=${property}
														.value=${
															// @ts-ignore
															this._project?.[key]?.[property]
														}
														.schema=${schema}
														.moduleId=${key}
														.handleInlangProjectChange=${this.handleInlangProjectChange}
													></simple-input>
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
				</div>`,

			error: (e) => html`<p>Error: ${e}</p>`,
		})
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-settings": InlangSettings
	}
}
