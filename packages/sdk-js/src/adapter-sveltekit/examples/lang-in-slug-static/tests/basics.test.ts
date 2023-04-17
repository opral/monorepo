import { test } from "@playwright/test"
import { baseURL } from "./index.js"

test("root slug should redirect to referenceLanguage slug", async ({ page }) => {
	await page.goto(baseURL)

	// TODO: test if redirect happens on the client
})

// TODO: for each language
const language = "en"

test("should display the correct language on home page", async ({ page }) => {
	await page.goto(`${baseURL}/${language}`)

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen

	// TODO: check if all data from load functions are passed to the rendering process

	// TODO: check if Math.random delivers another value on page reload
})

test("should SSR the page", async ({ page }) => {
	await page.goto(`${baseURL}/${language}`)

	// TODO: check if SSR works (disable JS and reload page?)
})

test("should display the correct language on the about page", async ({ page }) => {
	await page.goto(`${baseURL}/${language}/about`)

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen
})
