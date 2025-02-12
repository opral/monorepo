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
	const [isDialogOpen, setIsDialogOpen] = useState(false)

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
							<SlDropdown slot="variant-action">
								<div slot="trigger" className="dropdown-trigger">
									...
								</div>
								<SlMenu>
									<SlMenuItem onClick={() => setIsDialogOpen(true)}>Add Selector</SlMenuItem>
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
					<SlDialog slot="selector-button" label="Add Selector" open={isDialogOpen}>
						<ReactInlangAddSelector
							bundle={bundle}
							message={message}
							variants={message.variants}
							change={(e) => {
								handleChangeEvent(e)
								setIsDialogOpen(false)
							}}
						/>
					</SlDialog>
				</ReactInlangMessage>
			))}
		</ReactInlangBundle>
	)
}

export default Editor
