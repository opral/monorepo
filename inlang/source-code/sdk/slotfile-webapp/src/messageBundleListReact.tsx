import React, { useCallback, useEffect, useRef, useState } from "react"

import { createComponent } from "@lit/react"
import { InlangMessageBundle } from "@inlang/message-bundle-component"

import { MessageBundle } from "../../src/v2/types/message-bundle.js"
import { ProjectSettings2 } from "../../src/v2/types/project-settings.js"
import { VariableSizeList as List } from "react-window"
import { InlangProject2 } from "../../dist/v2/types/project.js"
import { openProject } from "./storage/db-messagebundle.js"
import { LintReport } from "../../dist/v2/index.js"
import { MessageBundleListSummary } from "./messageBundleListSummary.js"
import { LanguageTag } from "@inlang/language-tag"

export const MessageBundleComponent = createComponent({
	tagName: "inlang-message-bundle",
	elementClass: InlangMessageBundle,
	react: React,
	events: {
		changeMessageBundle: "change-message-bundle",
		fixLint: "fix-lint",
	},
})

type MessageBundleListProps = {
	project: Awaited<ReturnType<typeof openProject>>
}

export function MessageBundleList({ project }: MessageBundleListProps) {
	const [bundles, setBundles] = useState([] as MessageBundle[])
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

		const mc = project.inlangProject.messageBundleCollection
		setMessageBundleCollection(mc)
		query = mc
			.find({
				selector: selector,
			})
			//.sort({ updatedAt: "desc" })
			.$.subscribe((bundles) => {
				// query?.unsubscribe()
				setBundles(bundles)
			})

		return () => {
			query?.unsubscribe()
		}
	}, [textSearch, activeLocales])

	useEffect(() => {
		const sub = project.inlangProject.lintReports$.subscribe({
			next: (reports) => {
				setLintReports(reports)
			},
		})

		return () => {
			sub.unsubscribe()
		}
	}, [])

	useEffect(() => {
		let inlangProject: InlangProject2 | undefined = undefined

		inlangProject = project.inlangProject

		inlangProject.settings.subscribe({
			next: (settings) => {
				setProjectSettings(settings)
			},
		})

		return () => {
			// unsubscribe inlangProject?.settings()
		}
	}, [])

	const onBundleChange = (messageBundle: { detail: { argument: MessageBundle } }) => {
		// eslint-disable-next-line no-console
		messageBundleCollection?.upsert(messageBundle.detail.argument)
	}

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
					<MessageBundleComponent
						key={bundle.id}
						messageBundle={(bundle as any).toMutableJSON()}
						settings={projectSettings}
						lintReports={lintReports.filter((report) => report.messageBundleId === bundle.id)}
						changeMessageBundle={onBundleChange as any}
						filteredLocales={activeLocales.length > 0 ? activeLocales : undefined}
						fixLint={(e: any) => {
							const { fix, lintReport } = e.detail.argument as {
								fix: string
								lintReport: LintReport
							}

							console.log("fixing", fix, lintReport)
							project.inlangProject.fix(lintReport, { title: fix })
						}}
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
