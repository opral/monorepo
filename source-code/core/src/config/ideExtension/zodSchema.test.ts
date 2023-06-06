import * as z from "zod"
import { zodIdeExtensionConfigSchema } from "./zodSchema.js"
import { expect, it } from "vitest"
import type { IdeExtensionConfigSchema } from "./schema.js"

it("should have the same type as the manual typescript definition", () => {
	type ZodType = z.infer<typeof zodIdeExtensionConfigSchema>
	let x = 0 as unknown as ZodType
	const y = 1 as unknown as IdeExtensionConfigSchema
	// typescript should throw an error here if the types are not the same
	x = y
	expect(x).toBe(1)
})

it("should validate a valid config object", () => {
	const validConfig = {
		messageReferenceMatchers: [
			async () => [
				{
					messageId: "id",
					position: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
				},
			],
		],
		extractMessageOptions: [
			{
				callback: (messageId: string, selection: string) =>
					`console.log(\`${messageId}: ${selection}\`)`,
			},
		],
	}

	expect(() => zodIdeExtensionConfigSchema.parse(validConfig)).not.toThrow()
})

it("should throw an error for a config object with invalid extractMessageOptions", () => {
	const invalidConfig = {
		messageReferenceMatchers: [
			async () =>
				Promise.resolve([
					{
						messageId: "id",
						position: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
					},
				]),
		],
		extractMessageOptions: [
			{
				callback: (messageId: string, selection: string) =>
					`console.log(\`${messageId}: ${selection}\`)`,
			},
			{ callback: {} },
		],
	}

	expect(() => zodIdeExtensionConfigSchema.parse(invalidConfig)).toThrow(z.ZodError)
})

it("should throw an error for a config object with invalid messageReferenceMatchers", async () => {
	const invalidConfig = {
		messageReferenceMatchers: [
			async () => Promise.resolve([{ messageId: "id", position: "undefined" }]),
		],
		extractMessageOptions: [
			{
				callback: (messageId: string, selection: string) =>
					`console.log(\`${messageId}: ${selection}\`)`,
			},
		],
	}

	const validatedConfig = zodIdeExtensionConfigSchema.parse(invalidConfig)
	await expect(() =>
		validatedConfig.messageReferenceMatchers![0]!({ documentText: "" }),
	).rejects.toBeInstanceOf(z.ZodError)
})
