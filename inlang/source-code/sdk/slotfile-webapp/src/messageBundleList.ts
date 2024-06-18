import { MessageBundle } from "../../src/v2"
import { storage } from "./storage/db-messagebundle"
import { MessageBundleRxType } from "./storage/schema-messagebundle"
import { mockSetting } from "./mock/settings"

export async function setupMessageBundleList({
	messageListContainer,
	nameFilterInput,
	ageFilterInput,
}: {
	messageListContainer: HTMLDivElement
	nameFilterInput: HTMLInputElement
	ageFilterInput: HTMLInputElement
}) {
	const getHeroesList = async () => {
		const db$ = (await storage).database

		const renderTable = (messageBundles: MessageBundleRxType[]) => {
			console.log("rendering table with " + messageBundles.length)
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

			queryObservable = db$.messageBundles
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
				debugger
				db$.messageBundles.upsert(messageBundle.detail.argument as any)
			}
		)

		// document.body.addEventListener("click", (event: MouseEvent) => {
		// 	// Type guard to ensure the target is an HTMLAnchorElement
		// 	const target = event.target as HTMLElement

		// 	if (target.tagName === "A" && target.classList.contains("edit-hero")) {
		// 		// Get the data-id attribute
		// 		const dataId = (target as HTMLAnchorElement).getAttribute("data-id")

		// 		// Log the data-id attribute
		// 		if (dataId) {
		// 			console.log(dataId)
		// 			const query = db$.heroes
		// 				.findOne({
		// 					selector: {
		// 						id: dataId,
		// 					},
		// 				})
		// 				.exec()
		// 				.then((heroToEdit) => {
		// 					if (heroToEdit) {
		// 						heroIdElement.value = heroToEdit.id!
		// 						heroAgeElement.value = heroToEdit.age! + ""
		// 						heroNameElement.value = heroToEdit.name!
		// 					}
		// 				})
		// 		}
		// 	}
		// })
	}
	await getHeroesList()
}
