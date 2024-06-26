import React, { useEffect, useState } from "react"

import { createComponent } from "@lit/react"
import { InlangMessageBundle } from "@inlang/message-bundle-component"

import { MessageBundle } from "../../src/v2/types/message-bundle.js"
import { ProjectSettings2 } from "../../src/v2/types/project-settings.js"
import { InlangProject2 } from "../../dist/v2/types/project.js"
import { openProject } from "./storage/db-messagebundle.js"

export const MessageBundleComponent = createComponent({
	tagName: "inlang-message-bundle",
	elementClass: InlangMessageBundle,
	react: React,
	events: {
		changeMessageBundle: "change-message-bundle",
	},
})

type MessageBundleListProps = {
	project: Awaited<ReturnType<typeof openProject>>;
  };

export function MessageBundleList({	project } : MessageBundleListProps) {
	const [bundles, setBundles] = useState([] as MessageBundle[])
	const [projectSettings, setProjectSettings] = useState<ProjectSettings2 | undefined>(undefined)
	const [messageBundleCollection, setMessageBundleCollection] = useState<any>()

	useEffect(() => {
		let query = undefined as any
		
		const mc = project.inlangProject.messageBundleCollection
		setMessageBundleCollection(mc)
		query = mc
			.find()
			//.sort({ updatedAt: "desc" })
			.$.subscribe((bundles) => {
				setBundles(bundles)
			})
	
		return () => {
			query?.unsubscribe()
		}
	}, [])

	useEffect(() => {
		let inlangProject: InlangProject2 | undefined = undefined
		
		inlangProject = project.inlangProject

		inlangProject.settings.subscribe({
			next: settings => {
				setProjectSettings(settings)
			}
		})
	
		return () => {
			// unsubscribe inlangProject?.settings()
		}
	}, [])

	const onBundleChange = (messageBundle: { detail: { argument: MessageBundle } }) => {
		// eslint-disable-next-line no-console
		messageBundleCollection?.upsert(messageBundle.detail.argument)
	}

	return (
		<div>
		{ projectSettings &&
			<>
				
					{bundles.map((bundle) => (
						<MessageBundleComponent
							key={bundle.id}
							messageBundle={(bundle as any).toMutableJSON()}
							settings={projectSettings as any}
							changeMessageBundle={onBundleChange as any}
						/>
					))}
				
			</>
		}
		{ !projectSettings && 
			<>loading</>
		}
		</div>
	)
}
