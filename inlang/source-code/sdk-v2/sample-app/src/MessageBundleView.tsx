import React, { useEffect, useState } from "react"
import { createComponent } from "@lit/react"
import { InlangMessageBundle } from "@inlang/message-bundle-component"
import { BundleWithMessages } from "../../src/types/sdkTypes.js"
import { ProjectSettings2 } from "../../src/types/project-settings.js"
import { InlangProject } from "../../src/types/project.js"
import { LintReport } from "../../src/types/lint.js"
import { LanguageTag } from "../../src/types/language-tag.js"

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
	bundle: BundleWithMessages // TODO SDK2 make SDK Bundle a reactive query that delivers the bundle instead
	// reports: Subject<LintReport[]>
	projectSettings: ProjectSettings2
	project: InlangProject
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

	const onBundleChange = (messageBundle: { detail: { argument: BundleWithMessages } }) => {
		// eslint-disable-next-line no-console
		// TODO SDK-V2 check how we update the bundle in v2 sql
		// project.messageBundleCollection?.upsert(messageBundle.detail.argument)
	}

	return (
		<MessageBundleComponent
			key={bundle.id}
			messageBundle={currentBundle as any}
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
		prevProps.bundle.id === nextProps.bundle.id && true // deepEqual(prevProps.filteredLocales, nextProps.filteredLocales)
	)
}
export const MessageBundleViewMemoed = React.memo(MessageBundleView, areEqual)
