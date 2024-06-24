import { MessageBundle } from "../../src/v2/types/message-bundle.js"
import { storage } from "./storage/db-messagebundle.js"

import { mockSetting } from "./mock/settings.js"

export async function setupMessageBundleList({
	messageListContainer,
}: {
	messageListContainer: HTMLDivElement
	nameFilterInput: HTMLInputElement
	ageFilterInput: HTMLInputElement
}) {
	const getHeroesList = async () => {
		const messageBundleCollection = (await storage).inlangProject.messageBundleCollection
		const renderTable = (messageBundles: MessageBundle[]) => {
			// console.log("rendering table with " + messageBundles.length)
			messageListContainer.innerHTML = ""
			for (const messageBundleRx of messageBundles) {
				const messageBundle = messageBundleRx as unknown as MessageBundle

				const bundleElement: any = document.createElement("inlang-message-bundle")
				bundleElement.settings = mockSetting
				bundleElement.messageBundle = (messageBundle as any).toMutableJSON()

				messageListContainer.appendChild(bundleElement)
			}
		}

		const nameFilter = ""
		const ageFilter = -1

		let queryObservable = undefined as any

		const createQuery = () => {
			if (queryObservable !== undefined) {
				queryObservable.unsubscribe(renderTable)
				queryObservable = undefined
			}

			const selector = {} as any

			if (nameFilter !== "") {
				selector.name = { $regex: nameFilter, $options: "i" }
			}
			if (ageFilter !== -1) {
				selector.age = { $gt: ageFilter }
			}

			queryObservable = messageBundleCollection
				.find({
					selector: selector,
				})
				.sort({ updatedAt: "desc" })
				.$.subscribe(renderTable)
		}

		createQuery()

		// nameFilterInput.onkeyup = (ev: any) => {
		// 	nameFilter = ev.target.value
		// 	createQuery()
		// }

		// ageFilterInput.onchange = (ev: any) => {
		// 	ageFilter = ev.target.value !== "" ? parseInt(ev.target.value, 10) : -1
		// 	createQuery()
		// }
		;(document.body as any).addEventListener(
			"change-message-bundle",
			(messageBundle: { detail: { argument: MessageBundle } }) => {
				// eslint-disable-next-line no-console
				messageBundleCollection.upsert(messageBundle.detail.argument as any)
			}
		)
	}
	await getHeroesList()
}
