import { test } from "@playwright/test"
import { baseURL } from "./index.js"

test("should keep state consistent throughout navigation", async ({ page }) => {
	await page.goto(`${baseURL}/en`)

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen

	// TODO: check if all data from load functions are passed to the rendering process

	await page.goto(`${baseURL}/de`) // TODO: via button on screen

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen

	// TODO: check if all data from load functions are passed to the rendering process

	// TODO: check if Math.random delivers another value than previously

	await page.goto(`${baseURL}/de/about`) // TODO: via button on screen

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen

	// TODO: check if all data from load functions are passed to the rendering process

	// TODO: check if Math.random delivers same value than previously

	await page.goto(`${baseURL}/en/about`) // TODO: via button on screen

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen

	// TODO: check if all data from load functions are passed to the rendering process

	// TODO: check if Math.random delivers another value than previously
})
