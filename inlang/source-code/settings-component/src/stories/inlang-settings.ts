import { html, LitElement, css } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import { type InlangProject, ProjectSettings, InlangModule } from "@inlang/sdk"
import { Task } from "@lit/task"

import "./input-fields/simple-input.js"

@customElement("inlang-settings")
export class InlangSettings extends LitElement {
	static override styles = [
		baseStyling,
		css`
			.container {
				display: flex;
				flex-direction: column;
				gap: 20px;
			}
			.module-container {
				display: flex;
				flex-direction: column;
				gap: 20px;
			}
		`,
	]

	@property()
	inlangProject: ReturnType<InlangProject["settings"]> | undefined = undefined

	// private get _projectProperties() {
	// 	return ProjectSettings.allOf[0].properties
	// }

	private _projectProperties = new Task(this, {
		task: async ([inlangProject]) => {
			if (!inlangProject) throw new Error("No inlang project")

			const generalSchema: Record<
				InlangModule["default"]["id"] | "internal",
				{ meta?: InlangModule["default"]; schema: Record<string, Record<string, unknown>> }
			> = { internal: { schema: ProjectSettings.allOf[0] } }

			for (const module of inlangProject.modules) {
				const plugin = await import(module)
				if (plugin.default.settingsSchema?.properties) {
					generalSchema[plugin.default.id] = {
						schema: plugin.default.settingsSchema,
						meta: plugin.default,
					}
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
						return value.schema.properties && this.inlangProject
							? html`<div class="module-container">
									<h2>
										${(value.meta as { displayName?: { en: string } })?.displayName?.en || key}
									</h2>
									${Object.entries(value.schema.properties).map(([property, schema]) => {
										return key === "internal"
											? html`
													<simple-input
														.property=${property}
														.value=${this.inlangProject?.[
															property as keyof typeof this.inlangProject
														]}
														.schema=${schema}
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
