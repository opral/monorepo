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
	type: "neu" | "old";
}) => {
	return (
		<div className="pointer-events-none">
			<InlangBundleHeader bundle={props.bundle} settings={props.settings} />
			{props.bundle.messages.map((message) => {
				return (
					<InlangMessage
						key={message.id}
						message={message}
						locale={message.locale}
						settings={props.settings}
					>
						{message.variants.map((variant) => {
							const change = props.changes.find(
								(change) => change.value.id === variant.id
							);

							return (
								<InlangVariant
									slot="variant"
									key={variant.id}
									bundleId={props.bundle.id}
									message={message}
									locale={message.locale}
									variant={variant}
									className={clsx(!change ? "opacity-30" : "")}
								>
									<InlangPatternEditor
										slot="pattern-editor"
										pattern={variant.pattern}
										className={clsx(
											change &&
												clsx(
													props.type === "neu"
														? "inlang-pattern-editor-neu"
														: "inlang-pattern-editor-old"
												)
										)}
									></InlangPatternEditor>
									{change && props.type === "neu" && (
										<div
											slot="pattern-editor"
											className="absolute right-4 h-full flex items-center text-green-800"
										>
											by You | 2 min ago
										</div>
									)}
								</InlangVariant>
							);
						})}
					</InlangMessage>
				);
			})}
		</div>
	);
};

export default SingleDiffBundle;
