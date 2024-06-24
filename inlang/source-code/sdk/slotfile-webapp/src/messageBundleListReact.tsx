import React, { useEffect, useState } from "react"
import { storage } from "./storage/db-messagebundle.js"
import { createComponent } from "@lit/react"
import { InlangMessageBundle } from "@inlang/message-bundle-component"
import { mockSetting } from "./mock/settings.js"
import { MessageBundle } from "../../src/v2/types/message-bundle.js"

export const MessageBundleComponent = createComponent({
	tagName: "inlang-message-bundle",
	elementClass: InlangMessageBundle,
	react: React,
	events: {
		changeMessageBundle: "change-message-bundle",
	},
})

export function MessageBundleList() {
	const [bundles, setBundles] = useState([] as MessageBundle[])
	const [db, setDb] = useState<any>()

	useEffect(() => {
		let query = undefined as any
		;(async () => {
			const db$ = (await storage).database
			setDb(db$)
			query = db$.messageBundles
				.find()
				//.sort({ updatedAt: "desc" })
				.$.subscribe((bundles) => {
					setBundles(bundles)
				})
		})()
		return () => {
			query?.unsubscribe()
		}
	}, [])

	const onBundleChange = (messageBundle: { detail: { argument: MessageBundle } }) => {
		// eslint-disable-next-line no-console
		db?.messageBundles.upsert(messageBundle.detail.argument)
	}

	return (
		<div>
			{bundles.map((bundle) => (
				<MessageBundleComponent
					key={bundle.id}
					messageBundle={(bundle as any).toMutableJSON()}
					settings={mockSetting as any}
					changeMessageBundle={onBundleChange as any}
				/>
			))}
		</div>
	)
}
