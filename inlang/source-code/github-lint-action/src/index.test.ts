import { MockInstance, beforeEach, describe, expect, it, vi } from "vitest"
import * as main from "../src/main"
import * as core from "@actions/core"

const runMock = vi.spyOn(main, "run")

// Mock the GitHub Actions core library
// let debugMock: MockInstance
// let errorMock: MockInstance
let getInputMock: MockInstance
// let setFailedMock: MockInstance
// let setOutputMock: MockInstance

describe("test", () => {
	beforeEach(() => {
		vi.clearAllMocks()

		// debugMock = vi.spyOn(core, "debug")
		// errorMock = vi.spyOn(core, "error")
		getInputMock = vi.spyOn(core, "getInput")
		// setFailedMock = vi.spyOn(core, "setFailed")
		// setOutputMock = vi.spyOn(core, "setOutput")
	})

	it("runMock should return", async () => {
		// Set the action's inputs as return values from core.getInput()
		getInputMock.mockImplementation((name: string): string => {
			switch (name) {
				case "owner":
					return "nilsjacobsen"
				case "repo":
					return "test-repo-for-action"
				case "pr_number":
					return "1"
				case "token":
					return process.env.GITHUB_TOKEN || ""
				default:
					return ""
			}
		})
		await main.run()
		expect(runMock).toHaveReturned()
	})
})
