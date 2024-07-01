import { describe, it, expect, vi, beforeEach } from "vitest"
import { openSettingsViewCommand } from "./openSettingsView.js"
import * as vscode from "vscode"
import * as telemetryModule from "../services/telemetry/implementation.js"
import * as settingsModule from "../utilities/settings/settingsView.js"
import type { ProjectViewNode } from "../utilities/project/project.js"

vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	TreeItemCollapsibleState: {
		None: 0,
		Collapsed: 1,
		Expanded: 2,
	},
}))

vi.mock("../services/telemetry/implementation", () => ({
	telemetry: {
		capture: vi.fn(),
	},
}))

vi.mock("../utilities/settings/settingsView", () => ({
	settingsPanel: vi.fn(),
}))

describe("openSettingsViewCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	const mockContext = vi.mocked({} as vscode.ExtensionContext) // Mock or construct as needed
	const projectViewNodeMock: ProjectViewNode = {
		label: "Test Node",
		path: "/path/to/project",
		relativePath: "./project",
		isSelected: false,
		collapsibleState: vscode.TreeItemCollapsibleState.None,
		context: mockContext,
	}

	it("should register the command correctly", () => {
		// register the command with arguments
		openSettingsViewCommand.register(
			openSettingsViewCommand.command,
			openSettingsViewCommand.callback
		)

		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			"sherlock.openSettingsView",
			expect.any(Function)
		)
	})

	it("should open the settings panel successfully", async () => {
		const settingsPanelMock = vi.mocked(settingsModule.settingsPanel)
		settingsPanelMock.mockResolvedValue(undefined)

		await openSettingsViewCommand.callback({ node: projectViewNodeMock })

		expect(settingsPanelMock).toHaveBeenCalledWith({
			context: {},
		})
	})

	it("should capture telemetry when settings view is opened", async () => {
		const telemetryCaptureMock = vi.mocked(telemetryModule.telemetry.capture)
		telemetryCaptureMock.mockResolvedValue(undefined)

		await openSettingsViewCommand.callback({ node: projectViewNodeMock })

		expect(telemetryCaptureMock).toHaveBeenCalledWith({
			event: "IDE-EXTENSION Settings View opened",
		})
	})
})
