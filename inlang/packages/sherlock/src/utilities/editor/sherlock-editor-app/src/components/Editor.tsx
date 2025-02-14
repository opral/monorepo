import { BundleNested, ProjectSettings } from "@inlang/sdk"
import { vscode } from "../utils/vscode.js"
import React, { useState } from "react"
import {
	InlangMessage,
	InlangPatternEditor,
	InlangVariant,
	InlangBundle,
	ChangeEventDetail,
	InlangBundleAction,
	InlangAddSelector,
} from "@inlang/editor-component"
import { createComponent } from "@lit/react"
import { SlDialog, SlDropdown, SlMenu, SlMenuItem } from "@shoelace-style/shoelace/dist/react"

const ReactInlangBundle = createComponent({
	tagName: "inlang-bundle",
	elementClass: InlangBundle,
	react: React,
	events: {
		change: "change",
	},
})

const ReactInlangBundleAction = createComponent({
	tagName: "inlang-bundle-action",
	elementClass: InlangBundleAction,
	react: React,
})

const ReactInlangMessage = createComponent({
	tagName: "inlang-message",
	elementClass: InlangMessage,
	react: React,
})

const ReactInlangVariant = createComponent({
	tagName: "inlang-variant",
	elementClass: InlangVariant,
	react: React,
})

const ReactInlangPatternEditor = createComponent({
	tagName: "inlang-pattern-editor",
	elementClass: InlangPatternEditor,
	react: React,
	events: {
		onPatternEditorFocus: "pattern-editor-focus",
		onPatternEditorBlur: "pattern-editor-blur",
	},
})

const ReactInlangAddSelector = createComponent({
	tagName: "inlang-add-selector",
	elementClass: InlangAddSelector,
	react: React,
	events: {
		change: "change",
		onSubmit: "submit",
	},
})

const Editor: React.FC<{
	bundle: BundleNested
	settings: ProjectSettings
}> = ({ bundle, settings }) => {
	const handleChangeEvent = (e: Event) => {
		const change = (e as CustomEvent).detail as ChangeEventDetail
		vscode.postMessage({ command: "change", change })
	}

	const handleDelete = ({
		command,
		message,
	}: {
		command: "delete-bundle" | "delete-variant"
		message: {
			id: string
		}
	}) => {
		vscode.postMessage({ command, id: message.id })
	}

	return (
		<div className="relative">
			<ReactInlangBundle bundle={bundle} change={handleChangeEvent}>
				<ReactInlangBundleAction
					slot="bundle-action"
					actionTitle="Delete"
					onClick={() => handleDelete({ command: "delete-bundle", message: { id: bundle.id } })}
				/>
				{bundle.messages.map((message) => (
					<ReactInlangMessage
						key={message.id}
						slot="message"
						message={message}
						variants={message.variants}
						settings={settings}
					>
						{message.variants.map((variant) => (
							<ReactInlangVariant key={variant.id} slot="variant" variant={variant}>
								<ReactInlangPatternEditor slot="pattern-editor" variant={variant} />
								<SlDropdown
									slot="variant-action"
									className="animate-blendIn"
									distance={4}
									hoist
									onSlShow={(e) => {
										setTimeout(() => {
											e.target?.querySelector("sl-menu-item")?.focus()
										})
									}}
								>
									<div slot="trigger" className="px-2 cursor-pointer">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="20"
											height="20"
											viewBox="0 0 24 24"
											className="-mx-[2px]"
										>
											<path
												fill="currentColor"
												d="M7 12a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0m7 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0"
											/>
										</svg>
									</div>
									<SlMenu>
										<SlMenuItem
											onClick={() => {
												const dialog = document.getElementById(
													`selector-button-dialog-${bundle.id}`
												) as SlDialog
												if (dialog) {
													const child = dialog.children[0] as LitInlangAddSelector
													if (child) {
														child.message = message
														child.variants = message.variants
													}
													setTimeout(() => {
														dialog.show()
													})
												}
											}}
										>
											Add Selector
										</SlMenuItem>
										{message.variants.length > 1 && (
											<SlMenuItem
												onClick={() =>
													handleDelete({ command: "delete-variant", message: { id: variant.id } })
												}
											>
												Delete
											</SlMenuItem>
										)}
									</SlMenu>
								</SlDropdown>
							</ReactInlangVariant>
						))}
						<div
							slot="selector-button"
							title="Add selector"
							className="px-2 h-8 mt-[6px] ml-[1px] bg-white rounded text-zinc-600 flex items-center justify-center hover:bg-zinc-100 hover:border-zinc-400 cursor-pointer"
							onClick={() => {
								const dialog = document.getElementById(
									`selector-button-dialog-${bundle.id}`
								) as SlDialog
								if (dialog) {
									const child = dialog.children[0] as LitInlangAddSelector
									if (child) {
										child.message = message
										child.variants = message.variants
									}
									setTimeout(() => {
										dialog.show()
									})
								}
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								className="-mx-[3px]"
							>
								<path fill="currentColor" d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z" />
							</svg>
						</div>
					</ReactInlangMessage>
				))}
			</ReactInlangBundle>
			<SlDialog
				id={`selector-button-dialog-${bundle.id}`}
				className="add-selector-dialog"
				label="Add selector"
			>
				<ReactInlangAddSelector
					change={handleChangeEvent}
					onSubmit={() => {
						const dialog = document.getElementById(
							`selector-button-dialog-${bundle.id}`
						) as SlDialog
						dialog.hide()
					}}
					bundle={bundle}
					// message={message}
					// variants={message?.variants}
				/>
			</SlDialog>
		</div>
	)
}

export default Editor
