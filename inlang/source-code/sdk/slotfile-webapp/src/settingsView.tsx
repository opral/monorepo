import React, { useEffect, useState } from "react"

import { createComponent } from "@lit/react"
import { InlangSettings2 } from "@inlang/settings-component"

import { ProjectSettings2 } from "../../src/v2/types/project-settings.js"
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

	useEffect(() => {
		const settingsSub = project.inlangProject.settings.subscribe({
			next: (currentSettings) => {
				console.log("NEXT")
				setSettings(currentSettings)
			},
		})
		return () => {
			settingsSub.unsubscribe()
		}
	}, [])

	const updateSettings = (settings: any) => {
		console.log(settings)
		// eslint-disable-next-line no-console
		// TODO update settings on project messageBundleCollection?.upsert(messageBundle.detail.argument)
	}

	return (
		<div>{settings && <SettingsComponen2 settings={settings} setSettings={updateSettings} />}</div>
	)
}
