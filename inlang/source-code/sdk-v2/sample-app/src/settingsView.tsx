import React, { useEffect, useState } from "react"

import { createComponent } from "@lit/react"
import { InlangSettings2 } from "@inlang/settings-component"

import { ProjectSettings2, InstalledLintRule } from "../../src/types/project-settings.js"
import { openProject } from "./storage/db-messagebundle.js"

export const SettingsComponen2 = createComponent({
	tagName: "inlang-settings2",
	elementClass: InlangSettings2,
	react: React,
	events: {
		setSettings: "set-settings",
	},
})

type SettingsViewProps = {
	project: Awaited<ReturnType<typeof openProject>>
}

export function SettingsView({ project }: SettingsViewProps) {
	const [settings, setSettings] = useState<ProjectSettings2 | undefined>(undefined)
	const [installedLintRules, setInstalledLintRules] = useState<InstalledLintRule[]>([])

	useEffect(() => {
		const settingsSub = project.inlangProject.settings.subscribe({
			next: (currentSettings) => {
				setSettings(currentSettings)
			},
		})
		return () => {
			settingsSub.unsubscribe()
		}
	}, [])

	useEffect(() => {
		const settingsSub = project.inlangProject.installed.lintRules.subscribe({
			next: (currentInstalledLintRules) => {
				setInstalledLintRules(currentInstalledLintRules)
			},
		})
		return () => {
			settingsSub.unsubscribe()
		}
	}, [])

	// @ts-ignore
	const updateSettings = (event: any) => {
		project.inlangProject.setSettings(event.detail.argument)
		// eslint-disable-next-line no-console
		// TODO update settings on project messageBundleCollection?.upsert(messageBundle.detail.argument)
	}

	return (
		<div>
			{settings && (
				<SettingsComponen2
					settings={settings}
					setSettings={updateSettings}
					installedLintRules={installedLintRules}
				/>
			)}
		</div>
	)
}
