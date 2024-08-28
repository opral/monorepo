import "./inlang-bundle-action.ts"
import "./../../inlang-bundle.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"

import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.component.js"
import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js"
import { pluralBundle } from "@inlang/sdk2"
if (!customElements.get("sl-menu")) customElements.define("sl-menu", SlMenu)
if (!customElements.get("sl-dropdown")) customElements.define("sl-dropdown", SlDropdown)

const meta: Meta = {
	component: "inlang-bundle-action",
	title: "Public/Actions/inlang-bundle-action",
	argTypes: {
		actionTitle: { control: "text" },
	},
}

export default meta

export const Example: StoryObj = {
	render: () => {
		return html`<inlang-bundle-action actionTitle=${"Share"}></inlang-bundle-action>`
	},
}

export const ActionInBundle: StoryObj = {
	render: () => {
		return html`
			<style>
				.container {
					padding-bottom: 100px;
				}
			</style>
			<div class="container">
				<inlang-bundle .bundle=${pluralBundle} .messages=${[]}>
					<inlang-bundle-action actionTitle=${"Share"} slot="bundle-action"></inlang-bundle-action>
					<inlang-bundle-action actionTitle=${"Delete"} slot="bundle-action"></inlang-bundle-action>
					<inlang-bundle-action actionTitle=${"Rename"} slot="bundle-action"></inlang-bundle-action>
				</inlang-bundle>
			</div>
		`
	},
}
