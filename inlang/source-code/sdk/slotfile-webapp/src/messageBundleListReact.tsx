import React, { useCallback, useEffect, useRef, useState } from "react"

import { createComponent } from "@lit/react"
import { InlangMessageBundle } from "@inlang/message-bundle-component"

import { MessageBundle } from "../../src/v2/types/message-bundle.js"
import { ProjectSettings2 } from "../../src/v2/types/project-settings.js"
import { VariableSizeList as List } from "react-window"
import { InlangProject2 } from "../../dist/v2/types/project.js"
import { LintReport } from "../../dist/v2/index.js"
import { MessageBundleListSummary } from "./messageBundleListSummary.js"
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

	useEffect(() => {
		// Assume bundle$ is an RxJS Subject or Observable

		const subscription = bundle.$.subscribe((updatedBundle) => {
			console.log("updateing Bundle from subscrube")
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

				console.log("fixing", fix, lintReport)
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

const MessageBundleViewMemoed = React.memo(MessageBundleView, areEqual)

type MessageBundleListProps = {
	project: InlangProject2
}

export function MessageBundleList({ project }: MessageBundleListProps) {
	const [bundles, setBundles] = useState([] as RxDocument<MessageBundle>[])
	const [lintReports, setLintReports] = useState([] as LintReport[])
	const [projectSettings, setProjectSettings] = useState<ProjectSettings2 | undefined>(undefined)
	const [messageBundleCollection, setMessageBundleCollection] = useState<any>()

	const [activeLocales, setActiveLocales] = useState<LanguageTag[]>([])

	const [textSearch, setTextSearch] = useState("")

	useEffect(() => {
		let query = undefined as any

		// bundles[0].messages[0].variants[0].pattern
		let selector = {} as any

		if (textSearch !== "") {
			selector = {
				messages: {
					$elemMatch: {
						locale: { $in: activeLocales },
						variants: {
							$elemMatch: {
								pattern: {
									$elemMatch: {
										value: {
											$regex: textSearch,
										},
									},
								},
							},
						},
					},
				},
			}

			if (activeLocales.length === 0) {
				delete selector.messages.$elemMatch.locale
			}

			// { $regex: textSearch, $options: "i" }
		}

		// queryObservable = messageBundleCollection
		// 	.find({
		// 		selector: selector,
		// 	})

		const mc = project.messageBundleCollection
		setMessageBundleCollection(mc)
		query = mc
			.find({
				selector: selector,
			})
			//.sort({ updatedAt: "desc" })
			.$.subscribe((bundles) => {
				query?.unsubscribe()
				setBundles(bundles)
			})

		return () => {
			query?.unsubscribe()
		}
	}, [textSearch, activeLocales])

	useEffect(() => {
		let inlangProject: InlangProject2 | undefined = undefined

		inlangProject = project

		inlangProject.settings.subscribe({
			next: (settings) => {
				setProjectSettings(settings)
			},
		})

		return () => {
			// unsubscribe inlangProject?.settings()
		}
	}, [])

	const listRef = useRef<List>(null)
	const itemSizeMap = useRef<Record<number, number>>({})

	const getItemSize = (index: number) => {
		// Default to a standard size if not yet measured
		return itemSizeMap.current[index] || 100
	}

	const setItemSize = useCallback((index: number, size: number) => {
		if (size !== 0 && listRef.current && itemSizeMap.current[index] !== size) {
			itemSizeMap.current[index] = size

			listRef.current.resetAfterIndex(index)
		}
	}, [])

	const renderRow = ({ index, style }) => {
		const bundle = bundles[index]

		// Use a ref callback to measure the component's height
		const measureRef = (el: HTMLDivElement | null) => {
			if (el) {
				setTimeout(() => {
					const height = el.getBoundingClientRect().height
					// console.log("size for index:" + index + " " + height)
					setItemSize(index, height)
				}, 10)
			}
		}

		console.log(activeLocales)
		return (
			<div style={style}>
				<div ref={measureRef}>
					<MessageBundleViewMemoed
						key={bundle.id}
						bundle={bundle}
						projectSettings={projectSettings!}
						filteredLocales={activeLocales}
						project={project}
					/>
				</div>
			</div>
		)
	}

	return (
		<div>
			<div>
				{
					<input
						type="text"
						placeholder="search..."
						value={textSearch}
						onChange={(e) => {
							setTextSearch(e.target.value)
						}}
					/>
				}
			</div>

			{projectSettings && (
				<>
					<MessageBundleListSummary
						project={project}
						projectSettings={projectSettings}
						bundles={bundles}
						reports={lintReports}
						activeLanguages={activeLocales}
						onActiveLanguagesChange={(actives) => setActiveLocales(actives)}
					/>
					<List
						height={900} // Adjust based on your requirements
						itemCount={bundles.length}
						itemSize={getItemSize}
						width={"100%"}
						ref={listRef}
					>
						{renderRow}
					</List>
				</>
			)}
			{!projectSettings && <>loading</>}
		</div>
	)
}
