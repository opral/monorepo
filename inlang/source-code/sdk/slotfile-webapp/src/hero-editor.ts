import { storage } from "./storage/db"
import { randomHumanId } from "../../src/storage/human-id/human-readable-id.js"
import { HeroDocType } from "./storage/schema"

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
			await db$.heroes
				.insert({
					id: randomHumanId(),
					name,
					age,
					createdAt: new Date().getTime(),
					updatedAt: new Date().getTime(),
				})
				.then(resetForm)
		} else {
			await db$.heroes
				.upsert({
					id,
					name,
					age,
					updatedAt: new Date().getTime(),
				})
				.then(resetForm)
		}
	}

	const insertNHeros = async (n: number) => {
		const herosToInsert = [] as HeroDocType[]
		for (let i = 0; i < n; i++) {
			herosToInsert.push({
				id: randomHumanId(),
				name: randomHumanId(),
				age: Math.random(),
				createdAt: Date.now(),
				updatedAt: Date.now(),
			})
		}
		const db$ = (await storage).database
		console.time("inserting " + n + " herors")
		await db$.collections.heroes.bulkInsert(herosToInsert)
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
