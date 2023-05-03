import * as z from "zod"
import {
	IdeExtensionSettings,
	messageReferenceSchema,
	positionSchema,
	validateIdeExtensionSettings,
} from "./schema.js"
import { describe, expect, it } from "vitest"

describe("ideExtensionSchema", () => {
	it("should validate a valid config object", () => {
		const validConfig = {
			messageReferenceMatchers: () =>
				Promise.resolve([
					{
						messageId: "id",
						position: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
					},
				]),
			extractMessageOptions: [
				{
					callback: (messageId: string, selection: string) =>
						`console.log(\`${messageId}: ${selection}\`)`,
				},
			],
		}

		expect(() => validateIdeExtensionSettings(validConfig)).not.toThrow()
	})

	it("should throw an error for a config object with invalid extractMessageOptions", () => {
		const invalidConfig = {
			messageReferenceMatchers: () =>
				Promise.resolve([
					{
						messageId: "id",
						position: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
					},
				]),
			extractMessageOptions: [
				{
					callback: (messageId: string, selection: string) =>
						`console.log(\`${messageId}: ${selection}\`)`,
				},
				{ callback: {} },
			],
		}

		expect(() =>
			validateIdeExtensionSettings(invalidConfig as unknown as IdeExtensionSettings),
		).toThrow(z.ZodError)
	})

	it("should throw an error for a config object with invalid messageReferenceMatchers", async () => {
		const invalidConfig = {
			messageReferenceMatchers: () => Promise.resolve([{ messageId: "id", position: "undefined" }]),
			extractMessageOptions: [
				{
					callback: (messageId: string, selection: string) =>
						`console.log(\`${messageId}: ${selection}\`)`,
				},
			],
		}

		const validatedConfig = validateIdeExtensionSettings(
			invalidConfig as unknown as IdeExtensionSettings,
		)
		await expect(() =>
			validatedConfig.messageReferenceMatchers({ documentText: "hello" }),
		).rejects.toBeInstanceOf(z.ZodError)
	})
})

describe("positionSchema", () => {
	it("should validate a valid position object", () => {
		const validPosition = {
			start: { line: 0, character: 0 },
			end: { line: 0, character: 1 },
		}

		expect(() => positionSchema.parse(validPosition)).not.toThrow()
	})

	it("should throw an error for an invalid position object", () => {
		const invalidPosition = {
			start: { line: "0", character: 0 },
			end: { line: 0, character: 1 },
		}

		expect(() => positionSchema.parse(invalidPosition)).toThrow(z.ZodError)
	})
})

describe("messageReferenceSchema", () => {
	it("should validate a valid message reference object", () => {
		const validMessageRef = {
			messageId: "id",
			position: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
		}

		expect(() => messageReferenceSchema.parse(validMessageRef)).not.toThrow()
	})

	it("should throw an error for an invalid message reference object", () => {
		const invalidMessageRef = {
			messageId: 1,
			position: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
		}

		expect(() => messageReferenceSchema.parse(invalidMessageRef)).toThrow(z.ZodError)
	})
})
