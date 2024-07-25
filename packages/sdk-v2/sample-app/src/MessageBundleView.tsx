import React, { useEffect, useState } from "react"
import { createComponent } from "@lit/react"
import { InlangBundle } from "@inlang/bundle-component"
import { ProjectSettings2 } from "../../src/types/project-settings.js"
import { InlangProject } from "../../src/types/project.js"
import { LintReport } from "../../src/types/lint.js"
import { LanguageTag } from "../../src/types/language-tag.js"
import { NestedBundle, NestedMessage, Variant } from "../../src/index.js"

export const MessageBundleComponent = createComponent({
	tagName: "inlang-bundle",
	elementClass: InlangBundle,
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
})
type MessageBundleViewProps = {
	bundle: NestedBundle // TODO SDK2 make SDK Bundle a reactive query that delivers the bundle instead
	// reports: Subject<LintReport[]>
	projectSettings: ProjectSettings2
	project: InlangProject
	filteredLocales: LanguageTag[]
}
export function MessageBundleView({
	bundle,
	// reports,
	projectSettings,
	project,
	filteredLocales,
}: MessageBundleViewProps) {
	const [currentBundle, setBundle] = useState(bundle)

	useEffect(() => {
		// Assume bundle$ is an RxJS Subject or Observable
		// const subscription = bundle.$.subscribe((updatedBundle) => {
		// 	console.log("updateing Bundle from subscribe", updatedBundle)
		// 	// Handle the bundle update
		// 	setBundle(updatedBundle)
		// })
		// return () => {
		// 	// Clean up the subscription when the component unmounts or when bundle changes
		// 	subscription.unsubscribe()
		// }
	}, [bundle])

	const onBundleChange = (messageBundle: { detail: { argument: NestedBundle } }) => {
		// eslint-disable-next-line no-console
		// TODO SDK-V2 check how we update the bundle in v2 sql
		// project.messageBundleCollection?.upsert(messageBundle.detail.argument)
	}

	const onMesageInsert = (event: { detail: { argument: { message: NestedMessage } } }) => {
		const insertedMessage = event.detail.argument.message
		const dbPromise = project.message.insert(insertedMessage).execute()
	}
	const onMesageUpdate = (event: { detail: { argument: { message: NestedMessage } } }) => {
		const updatedMessage = event.detail.argument.message
		const dbPromise = project.message.update(updatedMessage).execute()
	}
	const onVariantInsert = (event: { detail: { argument: { variant: Variant } } }) => {
		const insertedVariant = event.detail.argument.variant
		const dbPromise = project.variant.insert(insertedVariant).execute()
	}
	const onVariantUpdate = (event: { detail: { argument: { variant: Variant } } }) => {
		const updatedVariant = event.detail.argument.variant
		const dbPromise = project.variant.update(updatedVariant).execute()
	}
	const onVariantDelete = (event: { detail: { argument: { variant: Variant } } }) => {
		const deletedVariant = event.detail.argument.variant
		const dbPromise = project.variant.delete(deletedVariant).execute()
	}

	console.log(currentBundle)

	return (
		<MessageBundleComponent
			key={bundle.id}
			bundle={currentBundle}
			settings={projectSettings}
			changeMessageBundle={onBundleChange as any}
			insertMessage={onMesageInsert as any}
			updateMessage={onMesageUpdate as any}
			insertVariant={onVariantInsert as any}
			updateVariant={onVariantUpdate as any}
			deleteVariant={onVariantDelete as any}
			filteredLocales={filteredLocales.length > 0 ? filteredLocales : undefined}
			fixLint={(e: any) => {
				const { fix, lintReport } = e.detail.argument as {
					fix: string
					lintReport: LintReport
				}

				project.fix(lintReport, { title: fix })
			}}
		/>
	)
}
