import { html, LitElement, css } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import { type InlangProject, ProjectSettings, InlangModule } from "@inlang/sdk"
import { Task } from "@lit/task"
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js"
setBasePath("./../../node_modules/@shoelace-style/shoelace/dist")

import "./input-fields/simple-input.js"

@customElement("inlang-settings")
export class InlangSettings extends LitElement {
	static override styles = [
		baseStyling,
		css`
			h3 {
				margin: 0;
				padding-bottom: 24px;
				border-bottom: 1px solid var(--sl-panel-border-color);
			}
			.container {
				display: flex;
				flex-direction: column;
				gap: 48px;
			}
			.module-container {
				display: flex;
				flex-direction: column;
				gap: 24px;
			}
		`,
	]

	@property()
	inlangProject: ReturnType<InlangProject["settings"]> | undefined = undefined

	@property()
	private _project: ReturnType<InlangProject["settings"]> | undefined = undefined

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
		// update ui when modules get updated
		if (property === "modules" && moduleId === undefined) {
			this.inlangProject = this._project
		}
		//console.log(this._project)
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
						return value.schema?.properties && this.inlangProject
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
														.value=${this.inlangProject?.[
															property as keyof typeof this.inlangProject
														]}
														.schema=${schema}
														.handleInlangProjectChange=${this.handleInlangProjectChange}
													></simple-input>
											  `
											: html`
													<simple-input
														.property=${property}
														.value=${JSON.stringify(
															// @ts-ignore
															this.inlangProject?.[key]?.[property]
														)}
														.schema=${schema}
														.moduleId=${key}
														.handleInlangProjectChange=${this.handleInlangProjectChange}
													></simple-input>
											  `
									})}
							  </div>`
							: undefined
					})}
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
