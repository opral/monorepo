import { useCallback, useEffect, useRef, useState } from "react"

import {
	InlangProject,
	LintReport,
	LanguageTag,
	ProjectSettings2,
	NestedBundle,
} from "../../src/types/index.js"
import { VariableSizeList as List } from "react-window"
import { MessageBundleViewMemoed } from "./MessageBundleView.js"
import { MessageBundleListSummary } from "./messageBundleListSummary.js"
import { populateMessages } from "../../src/loadProjectOpfs.js"

type MessageBundleListProps = {
	project: InlangProject
}

export function MessageBundleList({ project }: MessageBundleListProps) {
	const [bundles, setBundles] = useState([] as RxDocument<MessageBundle>[])
	const [currentListBundles, setCrurrentListBundles] = useState([] as NestedBundle[])

	const [lintReports, setLintReports] = useState([] as LintReport[])
	const [projectSettings, setProjectSettings] = useState<ProjectSettings2>(project.settings.get())
	const [messageBundleCollection, setMessageBundleCollection] = useState<any>()

	const [activeLocales, setActiveLocales] = useState<LanguageTag[]>([])

	const [textSearch, setTextSearch] = useState("")

	useEffect(() => {
		// TODO SDK-v2 setup query that filters by active language, reported lints, bundle ids and searches text within the filtered variants
		populateMessages(project.bundle.select)
			.execute()
			.then((freshBundles: any) => {
				setCrurrentListBundles(freshBundles)
			})
	}, [textSearch, activeLocales])

	useEffect(() => {
		const settingsSubscription = project.settings.subscribe(setProjectSettings)
		return () => {
			settingsSubscription.unsubscribe()
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
