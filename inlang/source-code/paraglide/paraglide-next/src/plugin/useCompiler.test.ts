import { describe, it, expect } from "vitest"
import { getCompileCommand, getWatchCommand } from "./useCompiler"
describe("useCompiler", () => {
	describe("getCompileCommand", () => {
		it("is silent if watch is true", () => {
			const command = getCompileCommand({
				watch: true,
				silent: false,
				project: "./project.inlang",
				outdir: "./outdir",
			})
			expect(command).toContain("--silent")
		})

		it("uses the correct outdir & project dir", () => {
			const command = getCompileCommand({
				watch: false,
				silent: true,
				project: "./somewhere/project.inlang",
				outdir: "./paraglide",
			})
			expect(command).toContain("--outdir ./paraglide")
			expect(command).toContain("--project ./somewhere/project.inlang")
		})

		const command = getCompileCommand({
			watch: true,
			silent: false,
			project: "./project.inlang",
			outdir: "./outdir",
		})
		expect(command).toContain("--silent")
	})

	describe("getWatchCommand", () => {
		it("watches", () => {
			const command = getWatchCommand({
				watch: true,
				silent: false,
				project: "./somewhere/project.inlang",
				outdir: "./paraglide",
			})
			expect(command).toContain("--watch")
		})

		it("is silent if silent is true", () => {
			it("watches", () => {
				const command = getWatchCommand({
					watch: true,
					silent: true,
					project: "./somewhere/project.inlang",
					outdir: "./paraglide",
				})
				expect(command).toContain("--silent")
			})
		})
	})
})
