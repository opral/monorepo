import { beforeEach } from "node:test"
import { test, expect, vi } from "vitest"

beforeEach(() => {
	vi.resetModules()
})

test("should log the messages in the correct language tag", async () => {
	const consoleMock = vi.spyOn(console, "log").mockImplementation(() => {})
	await import("./js/src/main.js")
	expect(consoleMock).toHaveBeenCalledTimes(2)
	expect(consoleMock.mock.calls[0][0]).toBe("Hello Samuel! You have 5 messages.")
	expect(consoleMock.mock.calls[1][0]).toBe("Hallo Samuel! Du hast 5 Nachrichten.")
})
