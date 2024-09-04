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
						</inlang-variant>`
					})}
				</inlang-message>`
			})}
		</inlang-bundle>`
	},
}

export const Themed: StoryObj = {
	args: {
		bundle: pluralBundle,
		messages: pluralBundle.messages,
	},
	render: () => {
		const [{ bundle, messages }] = useArgs()

		return html` <style>
				.inlang-pattern-editor-contenteditable {
					background-color: #2f2a33 !important;
					color: #fcfafc !important;
				}
				.inlang-pattern-editor-contenteditable:hover {
					background-color: #4a474d !important;
				}
				.inlang-pattern-editor-placeholder {
					color: #fcfafc !important;
				}
				inlang-variant {
					--sl-input-border-color: #9e9d9e;
					--sl-input-background-color: #2f2a33;
					--sl-input-background-color-focus: #4a474d;
					--sl-input-background-color-hover: #4a474d;
					--sl-input-border-color-hover: #9e9d9e;
					--sl-input-color: #fcfafc;
					--sl-input-color-focus: #fcfafc;
					--sl-input-color-hover: #fcfafc;
				}
				inlang-message {
					--sl-input-border-color: #9e9d9e;
					--sl-input-background-color: #2f2a33;
					--sl-input-background-color-focus: #4a474d;
					--sl-input-background-color-hover: #4a474d;
					--sl-input-border-color-hover: #9e9d9e;
					--sl-input-color: #fcfafc;
					--sl-input-color-focus: #fcfafc;
					--sl-input-color-hover: #fcfafc;
					--sl-input-background-color-disabled: #211f23;
					--sl-input-placeholder-color: #fcfafc;
				}
				inlang-bundle {
					--sl-input-border-color: #9e9d9e;
					--sl-input-background-color: #2f2a33;
					--sl-input-background-color-focus: #4a474d;
					--sl-input-background-color-hover: #4a474d;
					--sl-input-border-color-hover: #9e9d9e;
					--sl-input-color: #fcfafc;
					--sl-input-color-focus: #fcfafc;
					--sl-input-color-hover: #fcfafc;
					--sl-input-background-color-disabled: #211f23;
					--sl-input-placeholder-color: #fcfafc;
				}
				inlang-bundle::part(base) {
					background-color: #18161a;
				}
			</style>
			<inlang-bundle .bundle=${bundle} .messages=${messages}>
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
											<div slot="variant-action">Add selector</div>
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
						<div slot="selector-button" class="add-selector">Add selector</div>
						<sl-dialog slot="selector-button" label="Add Selector">
							<inlang-add-selector .message=${message} .messages=${messages}></inlang-add-selector>
						</sl-dialog>
					</inlang-message>`
				})}
			</inlang-bundle>`
	},
}
