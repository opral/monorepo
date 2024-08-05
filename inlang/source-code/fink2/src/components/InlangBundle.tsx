import { createComponent } from "@lit/react";
import { InlangBundle as LitInlangBundle } from "@inlang/bundle-component"
import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { projectAtom } from "../state.ts";
import {
	BundleNested,
	MessageNested,
	Variant,
	selectBundleNested,
} from "@inlang/sdk2";
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
		fixLint: "fix-lint",
	},
});

const InlangBundle = (props: { bundleId: string }) => {
	const [project] = useAtom(projectAtom);
	const [bundle, setBundle] = useState<BundleNested | undefined>(undefined);

	useEffect(() => {
		if (!project) return;
		queryBundle();
		setTimeout(async () => {
			queryBundle();
		}, 2000);
	}, []);

	const queryBundle = async () => {
		if (!project) return;
		const bundle = await selectBundleNested(project.db)
			.where("id", "=", props.bundleId)
			.executeTakeFirst();
		setBundle(bundle);
	};

	const onMesageInsert = (event: {
		detail: { argument: { message: MessageNested } };
	}) => {
		if (project) {
			const insertedMessage = event.detail.argument.message;
			queryHelper.message.insert(project.db, insertedMessage).execute();
		}
	};
	const onMesageUpdate = (event: {
		detail: { argument: { message: MessageNested } };
	}) => {
		if (project) {
			const updatedMessage = event.detail.argument.message;
			queryHelper.message.update(project.db, updatedMessage).execute();
		}
	};
	const onVariantInsert = async (event: {
		detail: { argument: { variant: Variant } };
	}) => {
		if (project) {
			const insertedVariant = event.detail.argument.variant;
			const result = await queryHelper.variant
				.insert(project.db, insertedVariant)
				.execute();
			console.log(result);
		}
	};
	const onVariantUpdate = async (event: {
		detail: { argument: { variant: Variant } };
	}) => {
		if (project) {
			const updatedVariant = event.detail.argument.variant;
			await queryHelper.variant.update(project.db, updatedVariant).execute();
		}
	};
	const onVariantDelete = (event: {
		detail: { argument: { variant: Variant } };
	}) => {
		if (project) {
			const deletedVariant = event.detail.argument.variant;
			queryHelper.variant.delete(project.db, deletedVariant).execute();
		}
	};

	return (
		<>
			{bundle && (
				<ReactBundle
					style={{ all: "initial" }}
					bundle={bundle}
					settings={project?.settings.get()}
					insertMessage={onMesageInsert as any}
					updateMessage={onMesageUpdate as any}
					insertVariant={onVariantInsert as any}
					updateVariant={onVariantUpdate as any}
					deleteVariant={onVariantDelete as any}
				/>
			)}
		</>
	);
};

export default InlangBundle;