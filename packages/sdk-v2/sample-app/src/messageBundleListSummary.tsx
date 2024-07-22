import { useEffect, useState } from "react"
import {
	InlangProject,
	InstalledLintRule,
	ProjectSettings2,
	LintReport,
	LanguageTag,
	NestedBundle
} from "../../src/types/index.js"

type MessageBundleListSummaryProps = {
	project: InlangProject
	projectSettings: ProjectSettings2
	bundles: NestedBundle[]
	reports: LintReport[]
	activeLanguages: LanguageTag[]
	onActiveLanguagesChange: (locales: LanguageTag[]) => void
}

export function MessageBundleListSummary({
	project,
	projectSettings,
	bundles,
	reports,
	activeLanguages,
	onActiveLanguagesChange,
}: MessageBundleListSummaryProps) {
	// const [bundles, setBundles] = useState([] as MessageBundle[])
	// const [lintReports, setLintReports] = useState([] as LintReport[])
	const [installedLints, setInstalledLints] = useState([] as InstalledLintRule[])

	const [mappedLintReports, setMappedLintReports] = useState({} as any)

	useEffect(() => {
		const sub = project.installed.lintRules.subscribe({
			next: (lintRules) => {
				setInstalledLints(lintRules)

				const bundleIds = new Set<string>()

				for (const bundle of bundles) {
					bundleIds.add(bundle.id)
				}

				const mapped = {} as any

				for (const lintRule of lintRules) {
					mapped[lintRule.id] = []
				}

				for (const report of reports) {
					if (bundleIds.has(report.target.bundleId)) {
						mapped[report.ruleId]?.push(report)
					}
				}
				setMappedLintReports(mapped)
			},
		})

		return () => {
			sub.unsubscribe()
		}
	}, [reports, bundles])

	const toggleLocale = (locale: LanguageTag) => {
		if (activeLanguages.length === 0) {
			onActiveLanguagesChange(projectSettings.locales.filter((current) => current !== locale))
			return
		}

		if (activeLanguages.includes(locale)) {
			onActiveLanguagesChange(activeLanguages.filter((current) => current !== locale))
		} else {
			onActiveLanguagesChange(activeLanguages.concat(locale))
		}
	}

	return (
		<div className="summary">
			<div>
				{projectSettings.locales.map((locale) => {
					return (
						<div key={locale}>
							<input
								type="checkbox"
								id="vehicle1"
								name="vehicle1"
								value="Bike"
								checked={activeLanguages.length == 0 || activeLanguages.includes(locale)}
								onChange={() => toggleLocale(locale)}
							/>
							{locale}
						</div>
					)
				})}
			</div>
			<div className="messageCount">Message Bundles: {bundles.length}</div>
			<div className="lintsReportsContainer">
				{installedLints.map((installedLint) => {
					const lintReports = mappedLintReports[installedLint.id]
					return (
						lintReports.length > 0 && (
							<div className="lintsReports" key={installedLint.id}>
								{installedLint.displayName as string} - {lintReports.length}
							</div>
						)
					)
				})}
			</div>
		</div>
	)
}
