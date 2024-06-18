import { storage } from "./storage/db-messagebundle"
import { randomHumanId } from "../../src/storage/human-id/human-readable-id.js"
import { HeroDocType } from "./storage/schema"
import { pluralBundle } from "../../src/v2/mocks"
import { createMessage, createMessageBundle } from "../../src/v2"
import { MessageBundleRxType } from "./storage/schema-messagebundle"

export function setupHeroEditor({
	heroNameElement,
	heroAgeElement,
	heroIdElement,
	saveElement,
	add100Element,
	add1000Element,
}: {
	heroNameElement: HTMLInputElement
	heroAgeElement: HTMLInputElement
	heroIdElement: HTMLInputElement
	saveElement: HTMLButtonElement
	add100Element: HTMLButtonElement
	add1000Element: HTMLButtonElement
}) {
	let heroId: string
	let heroName: string
	let heroAge: number
	const resetForm = () => {
		heroNameElement.value = ""
		heroAgeElement.value = ""
		heroIdElement.value = ""
	}
	const upsertHero = async (id: string, name: string, age: number) => {
		const db$ = (await storage).database
		if (id === "") {
			const newMessage = createMessage({
				locale: "de",
				text: "new",
			})

			const messageBundle = createMessageBundle({
				alias: {},
				messages: [newMessage],
			})

			await db$.messageBundles.insert(pluralBundle as any).then(resetForm)
		}
	}

	const insertNHeros = async (n: number) => {
		const messagesToAdd = [] as MessageBundleRxType[]
		for (let i = 0; i < n; i++) {
			const newMessage = createMessage({
				locale: "de",
				text: "new",
			})

			const messageBundle = createMessageBundle({
				alias: {},
				messages: [newMessage],
			})
			messagesToAdd.push(messageBundle as unknown as MessageBundleRxType)
		}
		const db$ = (await storage).database
		console.time("inserting " + n + " messages")

		await db$.collections.messageBundles.bulkInsert(messagesToAdd)
		console.timeEnd("inserting " + n + " herors")
	}

	add100Element.addEventListener("click", () => {
		insertNHeros(100)
	})

	add1000Element.addEventListener("click", () => {
		insertNHeros(1000)
	})

	saveElement.addEventListener("click", () => {
		heroName = heroNameElement.value
		heroId = heroIdElement.value
		heroAge = isNaN(parseInt(heroAgeElement.value, 10)) ? -1 : parseInt(heroAgeElement.value, 10)
		if (heroName.length > 0 && heroAge) {
			upsertHero(heroId, heroName, heroAge)
		} else {
			alert("Please fill all the fields")
		}
	})
}
