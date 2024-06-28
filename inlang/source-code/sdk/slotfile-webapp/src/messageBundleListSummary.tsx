import React, { useCallback, useEffect, useRef, useState } from "react"

import { createComponent } from "@lit/react"
import { InlangMessageBundle } from "@inlang/message-bundle-component"

import { MessageBundle } from "../../src/v2/types/message-bundle.js"
import { InstalledLintRule, ProjectSettings2 } from "../../src/v2/types/project-settings.js"
import { VariableSizeList as List } from "react-window"
import { InlangProject2 } from "../../dist/v2/types/project.js"
import { openProject } from "./storage/db-messagebundle.js"
import { LintReport } from "../../dist/v2/index.js"

type MessageBundleListProps = {
	project: Awaited<ReturnType<typeof openProject>>
	projectSettings: ProjectSettings2
	bundles: MessageBundle[]
	reports: LintReport[]
}

export function MessageBundleListSummary({
	project,
	projectSettings,
	bundles,
	reports,
}: MessageBundleListProps) {
	// const [bundles, setBundles] = useState([] as MessageBundle[])
	// const [lintReports, setLintReports] = useState([] as LintReport[])
	const [installedLints, setInstalledLints] = useState([] as InstalledLintRule[])

	useEffect(() => {
		const sub = project.inlangProject.installed.lintRules.subscribe({
			next: (lints) => {
				setInstalledLints(lints)
			},
		})

		return () => {
			sub.unsubscribe()
		}
	}, [])

	return (
		<div>
			Message Bundles: {bundles.length}
			{installedLints.map((installedLint) => {
				return <div>{installedLint.displayName as string}</div>
			})}
		</div>
	)
}
