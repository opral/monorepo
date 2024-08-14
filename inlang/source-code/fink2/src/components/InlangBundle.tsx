import { createComponent } from "@lit/react";
import { InlangBundle as LitInlangBundle } from "@inlang/bundle-component";
import React from "react";
import { useAtom } from "jotai";
import { pendingChangesAtom, projectAtom } from "../state.ts";
import { BundleNested, MessageNested, Variant } from "@inlang/sdk2";
import queryHelper from "../helper/queryHelper.ts";

export const ReactBundle = createComponent({
	tagName: "inlang-bundle",
	elementClass: LitInlangBundle,
	react: React,
	events: {
		changeMessageBundle: "change-message-bundle",
		insertMessage: "insert-message",
		updateMessage: "update-message",

		insertVariant: "insert-variant",
		updateVariant: "update-variant",
		deleteVariant: "delete-variant",
		showHistory: "show-history",
		fixLint: "fix-lint",
	},
});

const InlangBundle = (props: {
	bundle: BundleNested;
	setShowHistory: (variantId: string) => void;
}) => {
	const [project] = useAtom(projectAtom);
	const [pendingChanges] = useAtom(pendingChangesAtom);

	const onMesageInsert = async (event: {
		detail: { argument: { message: MessageNested } };
	}) => {
		if (project) {
			const insertedMessage = event.detail.argument.message;
			await queryHelper.message.insert(project.db, insertedMessage).execute();
		}
	};
	const onMesageUpdate = async (event: {
		detail: { argument: { message: MessageNested } };
	}) => {
		console.log("message update");
		if (project) {
			const updatedMessage = event.detail.argument.message;
			await queryHelper.message.update(project.db, updatedMessage).execute();
		}
	};
	const onVariantInsert = async (event: {
		detail: { argument: { variant: Variant } };
	}) => {
		if (project) {
			const insertedVariant = event.detail.argument.variant;
			await queryHelper.variant.insert(project.db, insertedVariant).execute();
		}
	};
	const onVariantUpdate = async (event: {
		detail: { argument: { variant: Variant } };
	}) => {
		console.log("update variant", event.detail.argument.variant.pattern);
		if (project) {
			const updatedVariant = event.detail.argument.variant;
			await queryHelper.variant.update(project.db, updatedVariant).execute();
		}
	};
	const onVariantDelete = async (event: {
		detail: { argument: { variant: Variant } };
	}) => {
		if (project) {
			const deletedVariant = event.detail.argument.variant;
			await queryHelper.variant.delete(project.db, deletedVariant).execute();
		}
	};

	return (
		<>
			{props.bundle && (
				<div className="relative">
					<ReactBundle
						style={{ all: "initial" }}
						bundle={props.bundle}
						settings={project?.settings.get()}
						insertMessage={onMesageInsert as any}
						updateMessage={onMesageUpdate as any}
						insertVariant={onVariantInsert as any}
						updateVariant={onVariantUpdate as any}
						deleteVariant={onVariantDelete as any}
						showHistory={(event: any) =>
							props.setShowHistory(event.detail.argument.variantId)
						}
					/>
					<div className="absolute top-0 right-0 pointer-events-none h-full">
						{arraysIntersect(
							getAllNestedIds(props.bundle),
							pendingChanges.map((change) => {
								if (change.value) {
									return change.value.id;
								} else {
									return undefined;
								}
							})
						) && <div className="bg-blue-500 w-[3px] h-full text-white" />}
					</div>
				</div>
			)}
		</>
	);
};

export default InlangBundle;

const getAllNestedIds = (bundle: BundleNested): string[] => {
	const messageIds = bundle.messages.map((message) => message.id);
	const variantIds = bundle.messages
		.flatMap((message) => message.variants)
		.map((variant) => variant.id);
	return [...messageIds, ...variantIds, ...bundle.id];
};

// @NilsJacobsen what is this function for?
function arraysIntersect(arr1: any[], arr2: any[]): boolean {
	// Convert the first array to a Set
	const set1 = new Set(arr1);

	// Check if any element in arr2 exists in set1
	for (const element of arr2) {
		if (set1.has(element)) {
			return true;
		}
	}

	// If no elements are found in the intersection
	return false;
}
