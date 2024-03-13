import { html, LitElement, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import { ProjectSettings } from "@inlang/project-settings"
import { InlangModule } from "@inlang/module"
import { Task } from "@lit/task"
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js"
setBasePath("./../../node_modules/@shoelace-style/shoelace/dist")

import "./input-fields/simple-input.js"

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

	@property()
	inlangProject: ProjectSettings | undefined = undefined

	@property()
	onSaveProject?: (project: ProjectSettings) => void = () => {}

	@state()
	private _project: ProjectSettings | undefined = undefined

	@state()
	private _unsavedChanges: boolean = false

	override async firstUpdated() {
		await this.updateComplete

		if (this.inlangProject) {
			this._project = JSON.parse(JSON.stringify(this.inlangProject))
		}
	}

	handleInlangProjectChange = (
		//value needs to be exactly how it goes in the project settings json
		value: string,
		property: string,
		moduleId?: InlangModule["default"]["id"]
	) => {
		//update state object
		if (this._project && moduleId) {
			this._project = {
				...this._project,
				[moduleId]: {
					...this._project[moduleId],
					[property]: value,
				},
			}
		} else if (this._project) {
			this._project = {
				...this._project,
				[property]: value,
			}
		}
		if (JSON.stringify(this.inlangProject) !== JSON.stringify(this._project)) {
			this._unsavedChanges = true
		} else {
			this._unsavedChanges = false
		}
	}

	_revertChanges = () => {
		if (this.inlangProject) {
			this._project = JSON.parse(JSON.stringify(this.inlangProject))
		}
		this._unsavedChanges = false
	}

	_saveChanges = () => {
		if (this._project && this.onSaveProject) {
			this.onSaveProject(this._project)
		}
		this._unsavedChanges = false
	}

	private _projectProperties = new Task(this, {
		task: async ([inlangProject]) => {
			if (!inlangProject) throw new Error("No inlang project")

			const generalSchema: Record<
				InlangModule["default"]["id"] | "internal",
				{ meta?: InlangModule["default"]; schema?: Record<string, Record<string, unknown>> }
			> = { internal: { schema: ProjectSettings.allOf[0] } }

			for (const module of inlangProject.modules) {
				try {
					const plugin = await import(module)
					if (plugin.default) {
						generalSchema[plugin.default.id] = {
							schema: plugin.default.settingsSchema,
							meta: plugin.default,
						}
					}
				} catch (e) {
					console.error(e)
				}
			}
			return generalSchema
		},
		args: () => [this.inlangProject],
	})

	override render() {
		return this._projectProperties.render({
			pending: () => html`<div>Loading...</div>`,
			complete: (properties) =>
				html` <div class="container">
					${Object.entries(properties).map(([key, value]) => {
						return value.schema?.properties && this._project
							? html`<div class="module-container">
									<h3>
										${(value.meta as { displayName?: { en: string } })?.displayName?.en || key}
									</h3>
									${Object.entries(value.schema.properties).map(([property, schema]) => {
										if (property === "$schema" || property === "modules") return undefined
										return key === "internal"
											? html`
													<simple-input
														.property=${property}
														.modules=${properties}
														.value=${this._project?.[property as keyof typeof this._project]}
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
