import { BundleNested, Message, ProjectSettings } from "@inlang/sdk"
import { vscode } from "../utils/vscode.js"
import React from "react"
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
import { v4 as uuidv4 } from "uuid"
import { rpc } from "@inlang/rpc"

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

	const createMessage = async (message: Message) => {
		if (message) {
			vscode.postMessage({
				command: "create-message",
				message,
			})
		}
	}

	return (
		<div className="relative">
			<ReactInlangBundle bundle={bundle} change={handleChangeEvent}>
				<ReactInlangBundleAction
					slot="bundle-action"
					actionTitle="Delete"
					onClick={() => handleDelete({ command: "delete-bundle", message: { id: bundle.id } })}
				/>
				{settings.locales.map((locale) => {
					const message = bundle.messages.find((message) => message.locale === locale)
					if (message) {
						return (
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
										{message.locale !== settings.baseLocale &&
											(!variant.pattern ||
												!Array.isArray(variant.pattern) ||
												variant.pattern.length === 0) && (
												<div
													className="px-2 cursor-pointer translate-button"
													title="Translate with Google Translate"
													slot="variant-action"
													onClick={async () => {
														try {
															// Show loading state
															vscode.postMessage({
																command: "show-info-message",
																message: "Translating...",
															})

															// Call translation service
															const result = await rpc.machineTranslateBundle({
																bundle: bundle,
																sourceLocale: settings.baseLocale,
																targetLocales: [message.locale],
															})

															if (result.error) {
																vscode.postMessage({
																	command: "show-error-message",
																	message: `Translation failed: ${result.error}`,
																})
															} else {
																// Update the bundle with translated content
																vscode.postMessage({
																	command: "translate-bundle",
																	translatedBundle: result.data,
																})

																vscode.postMessage({
																	command: "show-info-message",
																	message: "Translation complete",
																})
															}
														} catch (error) {
															vscode.postMessage({
																command: "show-error-message",
																message: `Translation error: ${error}`,
															})
														}
													}}
												>
													<svg
														width="20"
														height="20"
														viewBox="0 0 28 28"
														fill="none"
														xmlns="http://www.w3.org/2000/svg"
														className="-mx-[2px]"
													>
														<path
															d="M10.0602 18.701C10.2574 18.8402 10.4831 18.9339 10.721 18.9752C10.9589 19.0164 11.203 19.0043 11.4356 18.9395C11.6682 18.8748 11.8835 18.7592 12.0659 18.601C12.2483 18.4428 12.3932 18.2461 12.4902 18.025L13.2602 15.685C13.4474 15.122 13.7633 14.6104 14.1826 14.1907C14.602 13.771 15.1133 13.4547 15.6762 13.267L17.9142 12.54C18.2322 12.4293 18.5073 12.2211 18.7002 11.945C18.8491 11.7356 18.946 11.4939 18.9831 11.2397C19.0202 10.9855 18.9963 10.7261 18.9133 10.483C18.8304 10.2398 18.6908 10.0199 18.5061 9.84132C18.3214 9.66275 18.0969 9.53067 17.8512 9.45596L15.6362 8.73596C15.073 8.54916 14.5611 8.23375 14.1411 7.81474C13.721 7.39573 13.4044 6.88463 13.2162 6.32196L12.4892 4.08496C12.3774 3.76801 12.1698 3.49368 11.8952 3.29996C11.6189 3.10946 11.2912 3.00745 10.9557 3.00745C10.6201 3.00745 10.2924 3.10946 10.0162 3.29996C9.73728 3.49718 9.5274 3.77702 9.41616 4.09996L8.68016 6.36496C8.4924 6.91302 8.18245 7.4112 7.77376 7.8218C7.36507 8.2324 6.86834 8.54466 6.32116 8.73496L4.08116 9.46096C3.76242 9.57363 3.48672 9.78285 3.29243 10.0595C3.09813 10.3362 2.9949 10.6665 2.9971 11.0046C2.9993 11.3426 3.10682 11.6716 3.3047 11.9457C3.50258 12.2198 3.78098 12.4254 4.10116 12.534L6.31716 13.254C7.0356 13.4951 7.66719 13.9423 8.13316 14.54C8.39916 14.883 8.60416 15.268 8.73916 15.68L9.46716 17.914C9.57916 18.232 9.78716 18.507 10.0622 18.701M19.8062 24.781C20.0097 24.9248 20.2529 25.0017 20.5022 25.001C20.7497 25.0017 20.9914 24.9259 21.1942 24.784C21.4029 24.6366 21.5592 24.4264 21.6402 24.184L22.0122 23.041C22.0908 22.8037 22.2237 22.5879 22.4002 22.4109C22.5768 22.2338 22.7921 22.1003 23.0292 22.021L24.1952 21.643C24.4303 21.5594 24.6339 21.4053 24.778 21.2015C24.9221 20.9978 24.9997 20.7545 25.0002 20.505C25.0002 20.2489 24.9182 19.9995 24.7664 19.7933C24.6145 19.5871 24.4007 19.4349 24.1562 19.359L23.0122 18.989C22.7747 18.9102 22.559 18.7772 22.3819 18.6005C22.2048 18.4238 22.0714 18.2082 21.9922 17.971L21.6122 16.808C21.5302 16.5706 21.3759 16.3649 21.1709 16.2199C20.9658 16.0749 20.7205 15.9978 20.4694 15.9996C20.2183 16.0014 19.9741 16.0819 19.7711 16.2298C19.5682 16.3776 19.4168 16.5855 19.3382 16.824L18.9642 17.97C18.8875 18.2042 18.7581 18.4177 18.586 18.594C18.4138 18.7703 18.2035 18.9047 17.9712 18.987L16.8052 19.365C16.5695 19.4482 16.3654 19.6024 16.2209 19.8064C16.0763 20.0103 15.9986 20.254 15.9982 20.504C15.9984 20.7561 16.0781 21.0017 16.2258 21.2059C16.3735 21.4102 16.5818 21.5628 16.8212 21.642L17.9652 22.014C18.2035 22.0925 18.42 22.2261 18.5972 22.4038C18.7744 22.5815 18.9073 22.7984 18.9852 23.037L19.3642 24.2C19.4469 24.4349 19.6006 24.6383 19.8042 24.782"
															fill="currentColor"
														/>
													</svg>
												</div>
											)}
										<SlDropdown
											slot="variant-action"
											className="animate-blendIn"
											distance={4}
											hoist
											onSlShow={(e) => {
												setTimeout(() => {
													;(e.target as HTMLElement)?.querySelector("sl-menu-item")?.focus()
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
															// @ts-expect-error - TS doesn't know about the dialog component
														) as SlDialog
														if (dialog) {
															const child = dialog.children[0] as InlangAddSelector
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
															handleDelete({
																command: "delete-variant",
																message: { id: variant.id },
															})
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
											// @ts-expect-error - TS doesn't know about the dialog component
										) as SlDialog
										if (dialog) {
											const child = dialog.children[0] as InlangAddSelector
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
						)
					} else {
						const message: Message = {
							id: uuidv4(),
							selectors: [],
							locale,
							bundleId: bundle.id,
						}
						return (
							<ReactInlangMessage
								slot="message"
								message={message}
								settings={settings}
								key={`${bundle.id}-${locale}-empty`}
							>
								<p
									className="min-h-[44px] bg-white hover:bg-zinc-50 flex items-center px-2 text-[14px] text-zinc-500 hover:text-zinc-950 gap-[4px] cursor-pointer w-full"
									slot="variant"
									onClick={() => createMessage(message)}
								>
									<svg viewBox="0 0 24 24" width="18" height="18" className="w-5 h-5">
										<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"></path>
									</svg>
									{`Add ${locale}`}
								</p>
							</ReactInlangMessage>
						)
					}
				})}
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
							// @ts-expect-error - TS doesn't know about the dialog component
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
