import { describe, it, expect, vi, beforeEach } from "vitest"
import * as yaml from "js-yaml"
import { add, isAdopted } from "./index.js"
import type { NodeishFilesystem } from "@lix-js/fs"

vi.mock("js-yaml", async () => {
	const actual = (await vi.importActual("js-yaml")) as any
	return {
		...actual,
		load: vi.fn(actual.load),
		dump: vi.fn(actual.dump),
	}
})

describe("GitHub Actions Workflow Adoption Checks", () => {
	let fsMock: NodeishFilesystem

	beforeEach(() => {
		fsMock = {
			readdir: vi.fn(),
			// @ts-expect-error
			readFile: vi.fn(),
			stat: vi.fn(),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		}
	})

	it("detects adoption of Ninja i18n GitHub Action", async () => {
		// @ts-expect-error
		fsMock.readdir.mockResolvedValue(["ninja_i18n.yml"])
		// @ts-expect-error
		fsMock.readFile.mockResolvedValue(
			yaml.dump({
				name: "Ninja i18n action",
				on: { pull_request_target: {} },
				jobs: {
					"ninja-i18n": {
						name: "Ninja i18n - GitHub Lint Action",
						"runs-on": "ubuntu-latest",
						steps: [
							{
								name: "Checkout",
								id: "checkout",
								uses: "actions/checkout@v4",
							},
							{
								name: "Run Ninja i18n",
								id: "ninja-i18n",
								uses: "opral/ninja-i18n-action@main",
								env: {
									GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
								},
							},
						],
					},
				},
			})
		)
		// @ts-expect-error
		fsMock.stat.mockResolvedValue({ isDirectory: () => false })

		await expect(isAdopted({ fs: fsMock })).resolves.toBe(true)
	})

	it("correctly adds the Ninja i18n GitHub Action workflow", async () => {
		// @ts-expect-error
		fsMock.stat.mockRejectedValue(new Error("File not found"))

		await add({ fs: fsMock })

		expect(fsMock.mkdir).toHaveBeenCalledWith(".github/workflows", { recursive: true })
		// @ts-expect-error
		const writtenContent = fsMock.writeFile.mock.calls[0][1]
		expect(writtenContent).toContain("name: Ninja i18n action")
		expect(writtenContent).toContain("uses: opral/ninja-i18n-action@main")
	})

	it("does not find the action in deep nested directories beyond level 3", async () => {
		// Simulate deep directory structure
		// @ts-expect-error
		fsMock.stat.mockResolvedValue({ isDirectory: () => true })
		// @ts-expect-error
		fsMock.readdir.mockImplementation((path) => {
			if (path.endsWith("level1")) return Promise.resolve(["level2"])
			if (path.endsWith("level2")) return Promise.resolve(["level3"])
			if (path.endsWith("level3")) return Promise.resolve([])
			return Promise.resolve(["level1"])
		})
		// @ts-expect-error
		fsMock.stat.mockImplementation((path) =>
			Promise.resolve({
				isDirectory: () => path.includes("level"),
			})
		)

		await expect(isAdopted({ fs: fsMock })).resolves.toBe(false)
	})

	it("does not search beyond a depth of 3", async () => {
		// @ts-expect-error
		fsMock.readdir.mockImplementation((path) => {
			// Implement logic to simulate depth, based on the path argument
			if (path.endsWith("level3")) return Promise.resolve(["tooDeepDirectory"])
			return Promise.resolve(["level1"])
		})
		// @ts-expect-error
		fsMock.stat.mockImplementation((path) =>
			Promise.resolve({
				isDirectory: () => !path.endsWith(".yml"),
			})
		)

		await expect(isAdopted({ fs: fsMock })).resolves.toBe(false)
		// Ensure readdir was called the correct number of times to validate depth control
	})

	it("returns false if checking directory existence throws an error", async () => {
		// @ts-expect-error
		fsMock.stat.mockRejectedValue(new Error("Filesystem error"))

		await expect(isAdopted({ fs: fsMock })).resolves.toBe(false)
	})

	it("returns true when the action is found in a nested directory within depth limit", async () => {
		// @ts-expect-error
		fsMock.stat.mockResolvedValue({ isDirectory: () => true })
		// @ts-expect-error
		fsMock.readdir.mockImplementation((path) => {
			if (path === ".github/workflows") return Promise.resolve(["level1"])
			if (path === ".github/workflows/level1") return Promise.resolve(["level2"])
			if (path === ".github/workflows/level1/level2") return Promise.resolve(["ninja_i18n.yml"])
			return Promise.resolve([])
		})

		// @ts-expect-error
		fsMock.readFile.mockImplementation((path) => {
			if (path === ".github/workflows/level1/level2/ninja_i18n.yml") {
				return Promise.resolve(
					yaml.dump({
						name: "Ninja i18n action",
						on: { pull_request_target: {} },
						jobs: {
							"ninja-i18n": {
								"runs-on": "ubuntu-latest",
								steps: [
									{
										name: "Run Ninja i18n",
										uses: "opral/ninja-i18n-action@main",
										env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" },
									},
								],
							},
						},
					})
				)
			}
			return Promise.reject(new Error("File not found"))
		})

		// @ts-expect-error
		fsMock.stat.mockImplementation((path) =>
			Promise.resolve({
				isDirectory: () => !path.endsWith(".yml"),
			})
		)

		await expect(isAdopted({ fs: fsMock })).resolves.toBe(true)
	})

	it("returns false and logs an error for malformed YAML content", async () => {
		// @ts-expect-error
		fsMock.stat.mockResolvedValue({ isDirectory: () => true })
		// @ts-expect-error
		fsMock.readdir.mockResolvedValue(["ninja_i18n.yml"])
		// @ts-expect-error
		fsMock.readFile.mockResolvedValue("malformed yaml content")
		// @ts-expect-error
		fsMock.stat.mockResolvedValue({ isDirectory: () => false })

		await expect(isAdopted({ fs: fsMock })).resolves.toBe(false)
	})

	it("handles filesystem errors gracefully in isAdopted function", async () => {
		// @ts-expect-error
		fsMock.stat.mockRejectedValue(new Error("Filesystem error"))

		await expect(isAdopted({ fs: fsMock })).resolves.toBe(false)
	})

	it("handles errors when creating the workflow directory in add function", async () => {
		// @ts-expect-error
		fsMock.stat.mockResolvedValue({ isDirectory: () => false })
		// @ts-expect-error
		fsMock.mkdir.mockRejectedValue(new Error("Filesystem error"))

		await expect(add({ fs: fsMock })).rejects.toThrow("Filesystem error")
	})
})
