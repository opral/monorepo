import { test } from "@playwright/test"
import { baseURL } from "./index.js"

// TODO: for each language
test("should display the correct language on home page", async ({ page }) => {
	await page.goto(`${baseURL}`)

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen

	// TODO: check if all data from load functions are passed to the rendering process

	// TODO: check if Math.random delivers another value on page reload
})

test("should not SSR the page", async ({ page }) => {
	await page.goto(`${baseURL}`)

	// TODO: check if SSR delivers an empty page (disable JS and reload page?)
})

test("should display the correct language on the about page", async ({ page }) => {
	await page.goto(`${baseURL}/about`)

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen
})
