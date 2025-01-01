/* eslint-disable @typescript-eslint/no-explicit-any */
import { BundleNested, ProjectSettings } from "@inlang/sdk";
import { createComponent } from "@lit/react";
import {
	InlangBundle as LitInlangBundle,
	InlangMessage as LitInlangMessage,
	InlangVariant as LitInlangVariant,
	InlangPatternEditor as LitInlangPatternEditor,
} from "@inlang/editor-component";
import React from "react";
import clsx from "clsx";
import { useAtom } from "jotai";
import { authorNameAtom } from "../state.ts";

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
	const [authorName] = useAtom(authorNameAtom);
	// change in variables
	// change in
	return (
		<div className="pointer-events-none">
			<InlangBundle
				bundle={props.show === "old" ? props.oldBundle : props.bundle}
				className={clsx(
					"highlighted-bundle"
					// props.show === "old" ? "highlight-variables-red" : "highlight-variables-green"
				)}
			>
				{props.bundle.messages.map((message) => {
					const oldMessage = props.oldBundle.messages.find(
						(oldMessage) => oldMessage.id === message.id
					);
					return (
						<InlangMessage
							slot="message"
							key={message.id}
							message={props.show === "old" ? oldMessage : message}
							variants={props.show === "old" ? oldMessage?.variants : message.variants}
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
											variant={props.show === "old" ? oldVariant : variant}
											className={clsx(!change ? "opacity-30" : "")}
										>
											<InlangPatternEditor
												slot="pattern-editor"
												variant={props.show === "old" ? oldVariant : variant}
												className={clsx(
													change &&
														clsx(
															props.show === "neu" ? "highlight-green" : "highlight-red"
														)
												)}
											></InlangPatternEditor>
											{change && props.show === "neu" && (
												<div
													slot="pattern-editor"
													className="absolute right-4 h-full flex items-center text-green-800"
												>
													by {change.author === authorName ? "You" : change.author}
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
