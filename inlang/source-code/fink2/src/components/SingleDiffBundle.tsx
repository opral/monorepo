/* eslint-disable @typescript-eslint/no-explicit-any */
import { BundleNested, ProjectSettings } from "@inlang/sdk2";
import { createComponent } from "@lit/react";
import {
	InlangBundle as LitInlangBundle,
	InlangMessage as LitInlangMessage,
	InlangVariant as LitInlangVariant,
	InlangPatternEditor as LitInlangPatternEditor,
} from "@inlang/bundle-component";
import React from "react";
import clsx from "clsx";

export const InlangBundle = createComponent({
	tagName: "inlang-bundle",
	elementClass: LitInlangBundle,
	react: React,
	events: {
		change: "change",
	},
});
export const InlangMessage = createComponent({
	tagName: "inlang-message",
	elementClass: LitInlangMessage,
	react: React,
});
export const InlangVariant = createComponent({
	tagName: "inlang-variant",
	elementClass: LitInlangVariant,
	react: React,
});
export const InlangPatternEditor = createComponent({
	tagName: "inlang-pattern-editor",
	elementClass: LitInlangPatternEditor,
	react: React,
});

const SingleDiffBundle = (props: {
	bundle: BundleNested;
	oldBundle: BundleNested;
	settings: ProjectSettings;
	changes: any[];
	show: "neu" | "old";
}) => {
	return (
		<div className="pointer-events-none">
			<InlangBundle bundle={props.bundle}>
				{/* <InlangBundleHeader bundle={props.bundle} settings={props.settings} /> */}
				{props.bundle.messages.map((message) => {
					const oldMessage = props.oldBundle.messages.find(
						(oldMessage) => oldMessage.id === message.id
					);
					return (
						<InlangMessage
							slot="message"
							key={message.id}
							message={message}
							variants={message.variants}
							settings={props.settings}
							className="hide-new-variant"
						>
							{message.variants.map((variant) => {
								const change = props.changes.find(
									(change) => change.value.id === variant.id
								);
								const oldVariant = oldMessage?.variants.find(
									(oldVariant) => oldVariant.id === variant.id
								);
								if (
									props.show === "neu" ||
									(props.show === "old" && oldVariant?.pattern)
								) {
									return (
										<InlangVariant
											slot="variant"
											key={variant.id}
											variant={variant}
											className={clsx(!change ? "opacity-30" : "")}
										>
											<InlangPatternEditor
												slot="pattern-editor"
												variant={props.show === "neu" ? variant : oldVariant}
												className={clsx(
													change &&
														clsx(
															props.show === "neu"
																? "inlang-pattern-editor-neu"
																: "inlang-pattern-editor-old"
														)
												)}
											></InlangPatternEditor>
											{change && props.show === "neu" && (
												<div
													slot="pattern-editor"
													className="absolute right-4 h-full flex items-center text-green-800"
												>
													by {change.author}
												</div>
											)}
										</InlangVariant>
									);
								}
							})}
						</InlangMessage>
					);
				})}
			</InlangBundle>
		</div>
	);
};

export default SingleDiffBundle;
