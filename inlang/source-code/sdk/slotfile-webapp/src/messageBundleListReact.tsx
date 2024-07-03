import React, { useCallback, useEffect, useRef, useState } from "react"

import { MessageBundle } from "../../src/v2/types/message-bundle.js"
import { ProjectSettings2 } from "../../src/v2/types/project-settings.js"
import { VariableSizeList as List } from "react-window"
import { InlangProject2 } from "../../dist/v2/types/project.js"
import { LintReport } from "../../dist/v2/index.js"
import { MessageBundleListSummary } from "./messageBundleListSummary.js"
import { LanguageTag } from "@inlang/language-tag"
import { RxDocument } from "rxdb"
import { MessageBundleViewMemoed } from "./MessageBundleView.js"

type MessageBundleListProps = {
	project: InlangProject2
}

export function MessageBundleList({ project }: MessageBundleListProps) {
	const [bundles, setBundles] = useState([] as RxDocument<MessageBundle>[])
	const [currentListBundles, setCrurrentListBundles] = useState([] as RxDocument<MessageBundle>[])
	const [lintReports, setLintReports] = useState([] as LintReport[])
	const [projectSettings, setProjectSettings] = useState<ProjectSettings2 | undefined>(undefined)
	const [messageBundleCollection, setMessageBundleCollection] = useState<any>()

	const [activeLocales, setActiveLocales] = useState<LanguageTag[]>([])

	const [textSearch, setTextSearch] = useState("")

	useEffect(() => {
		let query = undefined as any
		let queryOnceSubscription = undefined as any
		let querySubscription = undefined as any

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
		query =
			//.sort({ updatedAt: "desc" })
			mc.find({
				selector: selector,
			}).$

		queryOnceSubscription = query.subscribe((bundles: any) => {
			queryOnceSubscription?.unsubscribe()

			setCrurrentListBundles(bundles)
		})

		querySubscription = query.subscribe((bundles: any) => {
			queryOnceSubscription?.unsubscribe()
			querySubscription?.unsubscribe()
			setBundles(bundles)
		})

		return () => {
			queryOnceSubscription?.unsubscribe()
			querySubscription?.unsubscribe()
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
		const bundle = currentListBundles[index]

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
						itemCount={currentListBundles.length}
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
