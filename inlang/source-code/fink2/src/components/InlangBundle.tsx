import { createComponent } from "@lit/react";

import { InlangBundle as LitInlangBundle } from "@inlang/bundle-component";
import { InlangMessage as LitInlangMessage } from "@inlang/bundle-component";
import { InlangVariant as LitInlangVariant } from "@inlang/bundle-component";
import { InlangPatternEditor as LitInlangPatternEditor } from "@inlang/bundle-component";
import { InlangAddSelector as LitInlangAddSelector } from "@inlang/bundle-component";

import React from "react";
import { useAtom } from "jotai";
import { pendingChangesAtom, projectAtom, settingsAtom } from "../state.ts";
import {
	BundleNested,
	createMessage,
	createVariant,
	Message,
	MessageNested,
	Variant,
} from "@inlang/sdk2";
import queryHelper from "../helper/queryHelper.ts";

const ReactInlangBundle = createComponent({
	tagName: "inlang-bundle",
	elementClass: LitInlangBundle,
	react: React,
	events: {
		change: "change",
	},
});

const ReactInlangMessage = createComponent({
	tagName: "inlang-message",
	elementClass: LitInlangMessage,
	react: React,
});

const ReactInlangVariant = createComponent({
	tagName: "inlang-variant",
	elementClass: LitInlangVariant,
	react: React,
});

const ReactInlangPatternEditor = createComponent({
	tagName: "inlang-pattern-editor",
	elementClass: LitInlangPatternEditor,
	react: React,
});

const ReactInlangAddSelector = createComponent({
	tagName: "inlang-add-selector",
	elementClass: LitInlangAddSelector,
	react: React,
});

const InlangBundle = (props: {
	bundle: BundleNested;
	setShowHistory: (variantId: string) => void;
}) => {
	const [project] = useAtom(projectAtom);
	const [pendingChanges] = useAtom(pendingChangesAtom);
	const [settings] = useAtom(settingsAtom);

	const onMesageInsert = async (message: Message) => {
		if (project) {
			await queryHelper.message.insert(project.db, message).execute();
		}
	};
	const onMesageUpdate = async (message: Message) => {
		if (project) {
			await queryHelper.message.update(project.db, message).execute();
		}
	};
	const onVariantInsert = async (variant: Variant) => {
		if (project) {
			await queryHelper.variant.insert(project.db, variant).execute();
		}
	};
	const onVariantUpdate = async (variant: Variant) => {
		if (project) {
			await queryHelper.variant.update(project.db, variant).execute();
		}
	};
	const onVariantDelete = async (variant: Variant) => {
		if (project) {
			await queryHelper.variant.delete(project.db, variant).execute();
		}
	};

	const handleChange = (e: Event) => {
		const data = (e as CustomEvent).detail.argument;
		console.log(data);
		switch (data.type) {
			case "Message":
				if (data.operation === "create") {
					onMesageInsert(data.newData as Message);
				} else if (data.operation === "update") {
					onMesageUpdate(data.newData as Message);
				}
				break;
			case "Variant":
				if (data.operation === "create") {
					onVariantInsert(data.newData as Variant);
				} else if (data.operation === "update") {
					onVariantUpdate(data.newData as Variant);
				} else if (data.operation === "delete") {
					onVariantDelete(data.newData as Variant);
				}
				break;
		}
	};

	return (
		<>
			{props.bundle && (
				<div className="relative">
					<ReactInlangBundle
						bundle={props.bundle}
						messages={props.bundle.messages}
						change={handleChange}
					>
						{settings.locales.map((locale) => {
							const message = props.bundle.messages.find(
								(message) => message.locale === locale
							);
							if (message) {
								return (
									<ReactInlangMessage
										slot="message"
										key={message.id}
										message={message}
										settings={settings}
									>
										{message.variants.map((variant) => {
											const change = pendingChanges.find(
												// eslint-disable-next-line @typescript-eslint/ban-ts-comment
												// @ts-ignore
												(change) => (change.value as Variant).id === variant.id
											);

											return (
												<ReactInlangVariant
													slot="variant"
													key={variant.id}
													variant={variant}
												>
													<ReactInlangPatternEditor
														slot="pattern-editor"
														variant={variant}
													/>

													{((message.selectors.length === 0 &&
														message.variants.length <= 1) ||
														!message.selectors) && (
														<ReactInlangAddSelector
															slot="variant-action"
															message={message}
															// eslint-disable-next-line @typescript-eslint/ban-ts-comment
															// @ts-ignore
															messages={
																props.bundle.messages as MessageNested[]
															}
														/>
													)}
													<div
														slot="edit-status"
														className="pl-2 text-[14px]! text-zinc-500"
													>
														By Nils, 10 hours ago
													</div>
													{change && (
														<div slot="edit-status" className="pl-2">
															<div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
														</div>
													)}
												</ReactInlangVariant>
											);
										})}
										<ReactInlangAddSelector
											slot="selector-button"
											message={message}
											// eslint-disable-next-line @typescript-eslint/ban-ts-comment
											// @ts-ignore
											messages={props.bundle.messages as MessageNested[]}
										/>
									</ReactInlangMessage>
								);
							} else {
								const message = createMessage({
									bundleId: props.bundle.id,
									locale: locale,
									text: "",
								});
								return (
									<ReactInlangMessage
										slot="message"
										message={message}
										key={`${props.bundle.id}-${locale}-empty`}
									>
										<p
											className="min-h-[44px] bg-white hover:bg-zinc-50 flex items-center px-2 text-[14px] text-zinc-500 hover:text-zinc-950 gap-[4px] cursor-pointer w-full"
											slot="variant"
											onClick={async () => {
												if (project) {
													await queryHelper.message
														.insert(project.db, message)
														.execute();

													await queryHelper.variant
														.insert(
															project.db,
															createVariant({ messageId: message.id })
														)
														.execute();
												}
											}}
										>
											<svg
												viewBox="0 0 24 24"
												width="18"
												height="18"
												className="w-5 h-5"
											>
												<path
													fill="currentColor"
													d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"
												></path>
											</svg>
											{`Add ${locale}`}
										</p>
									</ReactInlangMessage>
								);
							}
						})}
					</ReactInlangBundle>
				</div>
			)}
		</>
	);
};

export default InlangBundle;
