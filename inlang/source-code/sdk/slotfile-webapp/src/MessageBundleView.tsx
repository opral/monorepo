import React, { useEffect, useState } from "react"
import { createComponent } from "@lit/react"
import { InlangMessageBundle } from "@inlang/message-bundle-component"
import { MessageBundle } from "../../src/v2/types/message-bundle.js"
import { ProjectSettings2 } from "../../src/v2/types/project-settings.js"
import { InlangProject2 } from "../../dist/v2/types/project.js"
import { LintReport } from "../../dist/v2/index.js"
import { LanguageTag } from "@inlang/language-tag"
import { RxDocument, deepEqual } from "rxdb"

export const MessageBundleComponent = createComponent({
	tagName: "inlang-message-bundle",
	elementClass: InlangMessageBundle,
	react: React,
	events: {
		changeMessageBundle: "change-message-bundle",
		fixLint: "fix-lint",
	},
})
type MessageBundleViewProps = {
	bundle: RxDocument<MessageBundle>
	// reports: Subject<LintReport[]>
	projectSettings: ProjectSettings2
	project: InlangProject2
	filteredLocales: LanguageTag[]
}
function MessageBundleView({
	bundle,
	// reports,
	projectSettings,
	project,
	filteredLocales,
}: MessageBundleViewProps) {
	const [currentBundle, setBundle] = useState(bundle)

	console.log("render MessageBundle View")
	useEffect(() => {
		// Assume bundle$ is an RxJS Subject or Observable
		const subscription = bundle.$.subscribe((updatedBundle) => {
			console.log("updateing Bundle from subscribe", updatedBundle)
			// Handle the bundle update
			setBundle(updatedBundle)
		})

		return () => {
			// Clean up the subscription when the component unmounts or when bundle changes
			subscription.unsubscribe()
		}
	}, [bundle])

	const onBundleChange = (messageBundle: { detail: { argument: MessageBundle } }) => {
		// eslint-disable-next-line no-console
		project.messageBundleCollection?.upsert(messageBundle.detail.argument)
	}

	return (
		<MessageBundleComponent
			key={bundle.id}
			messageBundle={(currentBundle as any).toMutableJSON()}
			settings={projectSettings}
			changeMessageBundle={onBundleChange as any}
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
// Custom comparison function to compare the logical contents of the bundle
const areEqual = (prevProps: MessageBundleViewProps, nextProps: MessageBundleViewProps) => {
	console.log("check")
	// Assuming bundle has an id property to identify the logical record
	return (
		prevProps.bundle.id === nextProps.bundle.id &&
		deepEqual(prevProps.filteredLocales, nextProps.filteredLocales)
	)
}
export const MessageBundleViewMemoed = React.memo(MessageBundleView, areEqual)
