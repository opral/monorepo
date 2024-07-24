import { useCallback, useEffect, useRef, useState } from "react"

import {
	InlangProject,
	LintReport,
	LanguageTag,
	ProjectSettings2,
	NestedBundle,
} from "../../src/types/index.js"
import { VariableSizeList as List } from "react-window"
import { MessageBundleView, MessageBundleViewMemoed } from "./MessageBundleView.js"
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
		populateMessages(project.bundle.select)
			.execute()
			.then((freshBundles: any) => {
				setCrurrentListBundles(freshBundles)
			})
		// TODO SDK-v2 setup query that filters by active language, reported lints, bundle ids and searches text within the filtered variants
		const intervalId = setInterval(() => {
			populateMessages(project.bundle.select)
				.execute()
				.then((freshBundles: any) => {
					setCrurrentListBundles(freshBundles)
				})
		}, 1000)
		return () => clearInterval(intervalId)
	}, [textSearch, activeLocales])

	useEffect(() => {
		const settingsSubscription = project.settings.subscribe(setProjectSettings)
		return () => {
			settingsSubscription.unsubscribe()
		}
	}, [])

	const listRef = useRef<List>(null)
	const itemSizeMap = useRef<Record<number, number>>({})

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
					{currentListBundles.map((bundle) => {
						return (
							<MessageBundleView
								key={bundle.id}
								bundle={bundle}
								projectSettings={projectSettings!}
								filteredLocales={activeLocales}
								project={project}
							/>
						)
					})}
				</>
			)}
			{!projectSettings && <>loading</>}
		</div>
	)
}
