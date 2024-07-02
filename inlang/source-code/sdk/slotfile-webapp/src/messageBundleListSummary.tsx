import React, { useCallback, useEffect, useRef, useState } from "react"

import { createComponent } from "@lit/react"
import { InlangMessageBundle } from "@inlang/message-bundle-component"

import { MessageBundle } from "../../src/v2/types/message-bundle.js"
import { InstalledLintRule, ProjectSettings2 } from "../../src/v2/types/project-settings.js"
import { VariableSizeList as List } from "react-window"
import { InlangProject2 } from "../../dist/v2/types/project.js"

import { LintReport } from "../../dist/v2/index.js"
import { LanguageTag } from "@inlang/language-tag"

import { RxDocument } from "rxdb"

type MessageBundleListProps = {
	project: InlangProject2
	projectSettings: ProjectSettings2
	bundles: RxDocument<MessageBundle>[]
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
}: MessageBundleListProps) {
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
					if (bundleIds.has(report.messageBundleId)) {
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
