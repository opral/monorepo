import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
import { mockSettings } from "../mock/settings.ts"
import { bundleWithoutSelectors } from "../mock/messageBundle.ts"

import SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.component.js"
if (!customElements.get("sl-dialog")) customElements.define("sl-dialog", SlDialog)

//@ts-ignore
import { useArgs } from "@storybook/preview-api"
import { pluralBundle, type Message, type MessageNested, type Variant } from "@inlang/sdk2"
import { type DispatchChangeInterface } from "../helper/event.ts"

//components
import "./inlang-bundle.ts"
import "./message/inlang-message.ts"
import "./variant/inlang-variant.ts"
import "./pattern-editor/inlang-pattern-editor.ts"
import "./actions/bundle-action/inlang-bundle-action.ts"
import "./actions/add-selector/inlang-add-selector.ts"

const meta: Meta = {
	component: "inlang-bundle",
	title: "Public/inlang-bundle",
	argTypes: {
		bundle: {
			control: { type: "object" },
			description: "Type MessageBundle: see sdk v2",
		},
	},
}

export default meta

let simpleBundleBuffer = bundleWithoutSelectors

export const Example: StoryObj = {
	args: {
		bundle: bundleWithoutSelectors,
		messages: bundleWithoutSelectors.messages,
	},
	render: () => {
		const [{ bundle, messages }, updateArgs] = useArgs()

		const handleChange = (e) => {
			const data = e.detail.argument as DispatchChangeInterface
			const newBundle = structuredClone(simpleBundleBuffer)
			switch (data.type) {
				case "Message":
					if (data.newData) {
						const message = newBundle.messages.find((m) => m.id === (data.newData as Message).id)
						if (message) {
							message.selectors = (data.newData as Message).selectors
							message.declarations = (data.newData as Message).declarations
						}
					}
					break
				case "Variant":
					if (
						data.operation === "delete" &&
						newBundle.messages.some((m) => m.id === (data.newData as Variant).messageId)
					) {
						// delete variant
						const message = newBundle.messages.find(
							(m) => m.id === (data.newData as Variant).messageId
						)
						if (message) {
							message.variants = message.variants.filter((v) => v.id !== data.newData!.id)
						}
					} else if (
						data.newData &&
						newBundle.messages.some((m) => m.id === (data.newData as Variant).messageId)
					) {
						const message = newBundle.messages.find(
							(m) => m.id === (data.newData as Variant).messageId
						)
						if (message) {
							const index = message.variants.findIndex((v) => v.id === data.newData!.id)
							if (index === -1) {
								// create new variant
								message.variants.push(data.newData as Variant)
							} else {
								// update variant
								message.variants[index] = data.newData as Variant
							}
						}
					}
					break
			}
			simpleBundleBuffer = newBundle
			updateArgs({ bundle: newBundle, messages: newBundle.messages })
			console.info(data.type, data.operation, data.newData, newBundle)
		}

		const handleSelectorModal = () => {
			const dialog = document.querySelector("sl-dialog") as SlDialog
			dialog.show()
		}

		return html`<inlang-bundle .bundle=${bundle} .messages=${messages} @change=${handleChange}>
			${messages.map((message: MessageNested) => {
				return html`<inlang-message slot="message" .message=${message} .settings=${mockSettings}>
					${message.variants.map((variant) => {
						return html`<inlang-variant slot="variant" .variant=${variant}>
							<inlang-pattern-editor slot="pattern-editor" .variant=${variant}>
							</inlang-pattern-editor>
							${(message.selectors.length === 0 && message.variants.length <= 1) ||
							!message.selectors
								? html`<style>
											sl-dialog::part(body) {
												padding: 0;
												margin-top: -16px;
											}
											sl-dialog::part(panel) {
												border-radius: 8px;
											}
										</style>
										<div slot="variant-action" @click=${handleSelectorModal}>Add selector</div>
										<sl-dialog slot="variant-action" label="Add Selector">
											<inlang-add-selector
												.message=${message}
												.messages=${messages}
											></inlang-add-selector>
										</sl-dialog>`
								: ``}
						</inlang-variant>`
					})}
					<style>
						.add-selector {
							height: 44px;
							display: flex;
							align-items: center;
							margin-right: 12px;
						}
						sl-dialog::part(body) {
							padding: 0;
							margin-top: -16px;
						}
						sl-dialog::part(panel) {
							border-radius: 8px;
						}
					</style>
					<div slot="selector-button" class="add-selector" @click=${handleSelectorModal}>
						Add selector
					</div>
					<sl-dialog slot="selector-button" label="Add Selector">
						<inlang-add-selector .message=${message} .messages=${messages}></inlang-add-selector>
					</sl-dialog>
				</inlang-message>`
			})}
		</inlang-bundle>`
	},
}

let bundleBuffer = pluralBundle

export const Complex: StoryObj = {
	args: {
		bundle: pluralBundle,
		messages: pluralBundle.messages,
	},
	render: () => {
		const [{ bundle, messages }, updateArgs] = useArgs()

		const handleChange = (e) => {
			const data = e.detail.argument as DispatchChangeInterface
			const newBundle = structuredClone(bundleBuffer)
			switch (data.type) {
				case "Message":
					if (data.newData) {
						const message = newBundle.messages.find((m) => m.id === (data.newData as Message).id)
						if (message) {
							message.selectors = (data.newData as Message).selectors
							message.declarations = (data.newData as Message).declarations
						}
					}
					break
				case "Variant":
					if (
						data.operation === "delete" &&
						newBundle.messages.some((m) => m.id === (data.newData as Variant).messageId)
					) {
						// delete variant
						const message = newBundle.messages.find(
							(m) => m.id === (data.newData as Variant).messageId
						)
						if (message) {
							message.variants = message.variants.filter((v) => v.id !== data.newData!.id)
						}
					} else if (
						data.newData &&
						newBundle.messages.some((m) => m.id === (data.newData as Variant).messageId)
					) {
						const message = newBundle.messages.find(
							(m) => m.id === (data.newData as Variant).messageId
						)
						if (message) {
							const index = message.variants.findIndex((v) => v.id === data.newData!.id)
							if (index === -1) {
								// create new variant
								message.variants.push(data.newData as Variant)
							} else {
								// update variant
								message.variants[index] = data.newData as Variant
							}
						}
					}
					break
			}
			bundleBuffer = newBundle
			updateArgs({ bundle: newBundle, messages: newBundle.messages })
			console.info(data.type, data.operation, data.newData, newBundle)
		}

		return html`<inlang-bundle .bundle=${bundle} .messages=${messages} @change=${handleChange}>
			${messages.map((message: MessageNested) => {
				return html`<inlang-message slot="message" .message=${message} .settings=${mockSettings}>
					${message.variants.map((variant) => {
						return html`<inlang-variant slot="variant" .variant=${variant}>
							<inlang-pattern-editor slot="pattern-editor" .variant=${variant}>
							</inlang-pattern-editor>
							${(message.selectors.length === 0 && message.variants.length <= 1) ||
							!message.selectors
								? html`<inlang-add-selector
										slot="variant-action"
										.message=${message}
										.messages=${messages}
								  ></inlang-add-selector>`
								: ``}
						</inlang-variant>`
					})}
					<inlang-add-selector
						slot="selector-button"
						.message=${message}
						.messages=${messages}
					></inlang-add-selector>
				</inlang-message>`
			})}
		</inlang-bundle>`
	},
}
