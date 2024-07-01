import "./inlang-settings2.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { mockInstalledLintRules2, mockInstalledPlugins2, mockSettings2 } from "../mock/project2.js"
import { html } from "lit"

const meta: Meta = {
	component: "inlang-settings",
	title: "Public/inlang-settings2",
	argTypes: {
		settings: {
			control: { type: "object" },
			description:
				"Type ProjectSettings (https://github.com/opral/monorepo/blob/main/inlang/source-code/versioned-interfaces/project-settings/src/interface.ts)",
		},
		installedPlugins: {
			control: { type: "Array" },
			description:
				"Type InstalledPlugin[] (https://github.com/opral/monorepo/blob/57611514bf84d3e03b179ddf8d02725157ec6bd5/inlang/source-code/sdk/src/api.ts#L14)",
		},
		installedMessageLintRules: {
			control: { type: "Array" },
			description:
				"Type InstalledMessageLintRule[] (https://github.com/opral/monorepo/blob/57611514bf84d3e03b179ddf8d02725157ec6bd5/inlang/source-code/sdk/src/api.ts#L26)",
		},
	},
}

export default meta

export const Props: StoryObj = {
	render: () =>
		html`
			<inlang-settings2
				.settings=${mockSettings2}
				.installedPlugins=${mockInstalledPlugins2}
				.installedLintRules=${mockInstalledLintRules2}
				@set-settings=${(settings: any) => console.info("save", settings)}
			></inlang-settings2>
		`,
}
