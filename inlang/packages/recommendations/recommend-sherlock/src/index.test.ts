import { add, shouldRecommend, isAdopted } from "./index.js";
import { describe, it, expect, vi } from "vitest";

describe("Cross-sell Sherlock app", () => {
	it("should recognize when extension is already adopted", async () => {
		const fsMock: any = {
			stat: vi.fn().mockResolvedValue(true),
			readFile: vi
				.fn()
				.mockResolvedValue(
					JSON.stringify({ recommendations: ["inlang.vs-code-extension"] })
				),
		};
		expect(
			await shouldRecommend({ fs: fsMock, workingDirectory: "/mock/path" })
		).toBe(false);
		expect(
			await isAdopted({ fs: fsMock, workingDirectory: "/mock/path" })
		).toBe(true);
	});

	it("should recognize when extension is not adopted", async () => {
		const fsMock: any = {
			stat: vi.fn().mockResolvedValue(true),
			readFile: vi
				.fn()
				.mockResolvedValue(JSON.stringify({ recommendations: [] })),
		};
		expect(
			await shouldRecommend({ fs: fsMock, workingDirectory: "/mock/path" })
		).toBe(true);
		expect(
			await isAdopted({ fs: fsMock, workingDirectory: "/mock/path" })
		).toBe(false);
	});

	it("should merge with other extensions & add recommendation when not present", async () => {
		const fsMock: any = {
			stat: vi.fn().mockResolvedValue(true),
			readFile: vi
				.fn()
				.mockResolvedValue(
					JSON.stringify({ recommendations: ["some.other-extension"] })
				),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};
		await add({ fs: fsMock, workingDirectory: "/mock/path" });
		expect(fsMock.writeFile).toHaveBeenCalledWith(
			"/mock/path/.vscode/extensions.json",
			JSON.stringify(
				{
					recommendations: ["some.other-extension", "inlang.vs-code-extension"],
				},
				undefined,
				2
			)
		);
	});

	it("should handle the case when a workingDirectory is provided", async () => {
		const fsMock: any = {
			stat: vi.fn().mockResolvedValue(true),
			readFile: vi
				.fn()
				.mockResolvedValue(JSON.stringify({ recommendations: [] })),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};
		await add({ fs: fsMock, workingDirectory: "/mock/path" });
		expect(fsMock.writeFile).toHaveBeenCalledWith(
			"/mock/path/.vscode/extensions.json",
			JSON.stringify(
				{ recommendations: ["inlang.vs-code-extension"] },
				undefined,
				2
			)
		);
	});

	it("should handle the case when a workingDirectory is not provided", async () => {
		const fsMock: any = {
			stat: vi.fn().mockResolvedValue(true),
			readFile: vi
				.fn()
				.mockResolvedValue(JSON.stringify({ recommendations: [] })),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};
		await add({ fs: fsMock });
		expect(fsMock.writeFile).toHaveBeenCalledWith(
			".vscode/extensions.json",
			JSON.stringify(
				{ recommendations: ["inlang.vs-code-extension"] },
				undefined,
				2
			)
		);
	});

	it("should add recommendation array if parsed content is not of the expected type", async () => {
		const fsMock: any = {
			stat: vi.fn().mockResolvedValue(true),
			readFile: vi.fn().mockResolvedValue("invalid json"),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};
		await add({ fs: fsMock, workingDirectory: "/mock/path" });
		expect(fsMock.writeFile).toHaveBeenCalledWith(
			"/mock/path/.vscode/extensions.json",
			JSON.stringify(
				{ recommendations: ["inlang.vs-code-extension"] },
				undefined,
				2
			)
		);
	});

	it("should handle when the .vscode directory does not exist", async () => {
		const fsMock: any = {
			stat: vi.fn((path) =>
				path.includes(".vscode") ? Promise.reject(false) : Promise.resolve(true)
			),
			readFile: vi.fn(),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};
		await add({ fs: fsMock, workingDirectory: "/mock/path" });
		expect(fsMock.mkdir).toHaveBeenCalledWith("/mock/path/.vscode");
		expect(fsMock.writeFile).toHaveBeenCalledWith(
			"/mock/path/.vscode/extensions.json",
			expect.any(String)
		);
	});

	it("should handle when extensions.json does not exist", async () => {
		const fsMock: any = {
			stat: vi.fn((path) =>
				path.includes("extensions.json")
					? Promise.reject(false)
					: Promise.resolve(true)
			),
			readFile: vi.fn(),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};
		await add({ fs: fsMock, workingDirectory: "/mock/path" });
		expect(fsMock.writeFile).toHaveBeenCalledWith(
			"/mock/path/.vscode/extensions.json",
			expect.any(String)
		);
	});

	it("should return true if extensions.json does not exist", async () => {
		const fsMock: any = {
			stat: vi.fn((path) => {
				if (path.includes("extensions.json")) return Promise.reject(false);
				return Promise.resolve(true);
			}),
			readFile: vi.fn(),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};
		expect(
			await shouldRecommend({ fs: fsMock, workingDirectory: "/mock/path" })
		).toBe(true);
	});

	it("should return true for invalid extensions.json content", async () => {
		const fsMock: any = {
			stat: vi.fn().mockResolvedValue(true),
			readFile: vi
				.fn()
				.mockResolvedValue(JSON.stringify({ invalid: "content" })),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};
		expect(
			await shouldRecommend({ fs: fsMock, workingDirectory: "/mock/path" })
		).toBe(true);
	});

	it("should call readFile with the correct path on shouldRecommend when no workingDirectory is provided", async () => {
		const fsMock: any = {
			stat: vi.fn().mockResolvedValue(true),
			readFile: vi
				.fn()
				.mockResolvedValue(JSON.stringify({ recommendations: [] })),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};
		expect(await shouldRecommend({ fs: fsMock })).toBe(true);
		expect(fsMock.readFile).toHaveBeenCalledWith(".vscode/extensions.json", {
			encoding: "utf-8",
		});
	});

	it("should create extensions.json in the .vscode folder if it does not exist", async () => {
		const fsMock: any = {
			stat: vi.fn((path) => {
				// Simulate .vscode directory exists but extensions.json does not
				if (path.includes("extensions.json")) return Promise.reject(false);
				return Promise.resolve(true);
			}),
			readFile: vi.fn(),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};

		await add({ fs: fsMock, workingDirectory: "/mock/path" });

		expect(fsMock.writeFile).toHaveBeenCalledWith(
			"/mock/path/.vscode/extensions.json",
			expect.any(String)
		);
	});

	it("should not modify extensions.json if extension is already present", async () => {
		const fsMock: any = {
			stat: vi.fn().mockResolvedValue(true),
			readFile: vi
				.fn()
				.mockResolvedValue(
					JSON.stringify({ recommendations: ["inlang.vs-code-extension"] })
				),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};
		await add({ fs: fsMock, workingDirectory: "/mock/path" });
		expect(fsMock.writeFile).not.toHaveBeenCalled();
	});

	it("should handle errors in file operations", async () => {
		const error = new Error("File operation failed");
		const fsMock: any = {
			stat: vi.fn().mockRejectedValue(error),
			readFile: vi.fn().mockRejectedValue(error),
			writeFile: vi.fn().mockRejectedValue(error),
			mkdir: vi.fn().mockRejectedValue(error),
		};

		await expect(
			add({ fs: fsMock, workingDirectory: "/mock/path" })
		).rejects.toThrow("File operation failed");
	});

	it("should reset extensions.json if it contains malformed content", async () => {
		const malformedContent = "this is not valid json";

		const fsMock: any = {
			stat: vi.fn().mockResolvedValue(true),
			readFile: vi.fn().mockResolvedValue(malformedContent),
			writeFile: vi.fn(),
			mkdir: vi.fn(),
		};

		await add({ fs: fsMock, workingDirectory: "/mock/path" });
		expect(fsMock.writeFile).toHaveBeenCalledWith(
			"/mock/path/.vscode/extensions.json",
			JSON.stringify(
				{ recommendations: ["inlang.vs-code-extension"] },
				undefined,
				2
			)
		);
	});

	it("should handle read/write errors gracefully", async () => {
		const error = new Error("File operation failed");

		const fsMock: any = {
			stat: vi.fn().mockRejectedValue(error),
			readFile: vi.fn().mockRejectedValue(error),
			writeFile: vi.fn().mockRejectedValue(error),
			mkdir: vi.fn().mockRejectedValue(error),
		};

		await expect(
			add({ fs: fsMock, workingDirectory: "/mock/path" })
		).rejects.toThrow("File operation failed");
	});
});
