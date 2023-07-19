import { test } from "@playwright/test"
import { baseURL } from "./index.js"

test("should keep state consistent throughout navigation", async ({ page }) => {
	await page.goto(`${baseURL}`)

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen

	// TODO: check if all data from load functions are passed to the rendering process

	// TODO: switch languageTag to 'de'

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen

	// TODO: check if all data from load functions are passed to the rendering process

	// TODO: check if Math.random delivers another value than previously

	// TODO: goto 'about' page

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen

	// TODO: check if all data from load functions are passed to the rendering process

	// TODO: check if Math.random delivers same value than previously

	// TODO: switch languageTag to 'de'

	// TODO: test if all logs are executed (server and client)

	// TODO: test if all messages appear on screen

	// TODO: check if all data from load functions are passed to the rendering process

	// TODO: check if Math.random delivers another value than previously
})
