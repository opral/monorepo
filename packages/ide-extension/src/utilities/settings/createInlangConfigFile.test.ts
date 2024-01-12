import { describe, it, expect, vi, beforeEach } from "vitest"
import { createInlangConfigFile, isDisabledConfigFileCreation } from "./createInlangConfigFile.js"
import * as vscode from "vscode"
import * as telemetry from "../../services/telemetry/implementation.js"
import { getSetting, updateSetting } from "../settings/index.js"
import { tryAutoGenProjectSettings } from "@inlang/create-project"

vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	workspace: {
		findFiles: vi.fn(),
		getConfiguration: vi.fn(),
		workspaceFolders: [],
	},
	WorkspaceFolder: vi.fn(),
	EventEmitter: vi.fn(),
	Uri: {
		parse: vi.fn(),
	},
}))
vi.mock("node:fs/promises")
vi.mock("../../services/telemetry/implementation.js")
vi.mock("../settings/index.js")
vi.mock("@inlang/create-project")

beforeEach(() => {
	vi.mocked(vscode.workspace.findFiles).mockClear()
	vi.mocked(vscode.workspace.getConfiguration).mockClear()
	vi.mocked(getSetting).mockClear()
	vi.mocked(updateSetting).mockClear()
	vi.mocked(tryAutoGenProjectSettings).mockClear()
})

// TODO: Improve tests
describe("createInlangConfigFile", () => {
	beforeEach(() => {
		// Mock getSetting to return an empty array for "disableConfigFileCreation"
		vi.mocked(getSetting).mockImplementation((setting) => {
			if (setting === "disableConfigFileCreation") {
				return Promise.resolve([])
			}
			return Promise.resolve(undefined)
		})
	})

	it("skips creating config file if it already exists", async () => {
		vi.mocked(vscode.workspace.findFiles).mockResolvedValue([])
		const mockWorkspaceFolder: vscode.WorkspaceFolder = {
			// @ts-expect-error
			uri: { fsPath: "/path/to/workspace" }, // Mock fsPath
			name: "workspace",
			index: 0,
		}
		await createInlangConfigFile({ workspaceFolder: mockWorkspaceFolder })
		expect(vscode.workspace.findFiles).toHaveBeenCalledWith("project.inlang/settings.json")
	})
})

describe("isDisabledConfigFileCreation", () => {
	it("returns true if config file creation is disabled", async () => {
		vi.mocked(getSetting).mockResolvedValue(["some-git-origin"])
		vi.mocked(telemetry.getGitOrigin).mockResolvedValue("some-git-origin")
		const result = await isDisabledConfigFileCreation()
		expect(result).toBe(true)
	})
})
