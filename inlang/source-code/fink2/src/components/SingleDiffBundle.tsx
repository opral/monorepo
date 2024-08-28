import { BundleNested, ProjectSettings } from "@inlang/sdk2";
import { createComponent } from "@lit/react";
import {
	InlangBundleHeader as LitInlangBundleHeader,
	InlangMessage as LitInlangMessage,
	InlangVariant as LitInlangVariant,
	InlangPatternEditor as LitInlangPatternEditor,
} from "@inlang/bundle-component";
import React from "react";
import clsx from "clsx";

export const InlangBundleHeader = createComponent({
	tagName: "inlang-bundle-header",
	elementClass: LitInlangBundleHeader,
	react: React,
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
			<InlangBundleHeader bundle={props.bundle} settings={props.settings} />
			{props.bundle.messages.map((message) => {
				const oldMessage = props.oldBundle.messages.find(
					(oldMessage) => oldMessage.id === message.id
				);
				return (
					<InlangMessage
						key={message.id}
						message={message}
						locale={message.locale}
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
										bundleId={props.bundle.id}
										message={message}
										locale={message.locale}
										variant={variant}
										className={clsx(!change ? "opacity-30" : "")}
										noHistory={true}
									>
										<InlangPatternEditor
											slot="pattern-editor"
											pattern={
												props.show === "neu"
													? variant.pattern
													: oldVariant?.pattern
											}
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
		</div>
	);
};

export default SingleDiffBundle;
