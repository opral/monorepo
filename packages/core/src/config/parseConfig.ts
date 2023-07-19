import type { InlangConfig } from "./schema.js"
import type * as ast from "../ast/schema.js"
import type { Result } from "../utilities/result.js"
import { dedent } from "ts-dedent"
import { zConfig } from "./zod.js"
import { Message } from "../ast/zod.js"

export class ParseConfigException extends Error {
	readonly #id = "ParseConfigException"
}

/**
 * Validates the config.
 *
 * If you want to test the config of the inlang.config.js file,
 * use the `testConfigFile` function instead.
 *
 * @example
 * const [success, error] = await testConfig(args)
 */
export async function parseConfig(args: {
	config: InlangConfig
}): Promise<Result<InlangConfig, ParseConfigException>> {
	// each function throws an error if the validation fails.
	try {
		// migrate the config if necessary
		maybeLanguageTagBreakingChangeMigration(args.config)
		// validate the config -> throws if invalid
		definedGetAndSaveMessages(args.config)
		const parsedConfig = zConfig.passthrough().parse(args.config)
		sourceLanguageTagMustBeInLanguageTags(args.config)
		const messages = await args.config.getMessages({ config: args.config })
		validateMessages(messages)
		await roundtripTest(args.config, messages)
		return [parsedConfig as InlangConfig, undefined]
	} catch (error) {
		return [undefined, error as ParseConfigException]
	}
}

function definedGetAndSaveMessages(config: InlangConfig) {
	if (!config.getMessages || !config.getMessages) {
		throw new ParseConfigException(
			`getMessages() or getMessages() are undefined. Did you forget to use a plugin? See https://inlang.com/documentation/plugins/registry.`,
		)
	}
}

function sourceLanguageTagMustBeInLanguageTags(config: InlangConfig) {
	if (!config.languageTags.includes(config.sourceLanguageTag)) {
		throw new ParseConfigException(
			`The source language tag "${config.sourceLanguageTag}" must be included in the list of language tags.`,
		)
	}
}

function maybeLanguageTagBreakingChangeMigration(config: InlangConfig) {
	// @ts-expect-error - this is a migration
	if (config.referenceLanguage && config.sourceLanguageTag === undefined) {
		// @ts-expect-error - this is a migration
		config.sourceLanguageTag = config.referenceLanguage
		//! DO NOT DELETE the old keys, otherwise plugin functionality will break
		// delete config.referenceLanguage
	}
	// @ts-expect-error - this is a migration
	// Somewhere in the system languageTags might be defined as empty array.
	// Thus, don't check for undefined languageTags here.
	if (config.languages) {
		// @ts-expect-error - this is a migration
		config.languageTags = [...new Set(config.languages, config.languageTags ?? [])]
		//! DO NOT DELETE the old keys, otherwise plugin functionality will break
		// delete config.languages
	}
}

function validateMessages(messages: ast.Message[]) {
	for (const message of messages) {
		// parse throws an error if any resource is invalid
		Message.parse(message)
	}
}

/**
 * Testing a roundtrip of getting and saving messages.
 *
 * getMessages -> State (1) -> saveMessages -> getMessages -> State (2).
 *
 * State (1) and State (2) must be equal. Otherwise, the defined getMessages
 * and saveMessages functions are not implemented correctly e.g. by missing messages
 * in the roundtrip.
 */
async function roundtripTest(config: InlangConfig, initialMessages: ast.Message[]) {
	const commonErrorMessage =
		"A roundtrip test of the getMessages and saveMessages functions failed:\n"
	await config.saveMessages({ config, messages: initialMessages })
	const getMessagesAgain = await config.getMessages({ config })
	// check if the number of messages are identical
	if (initialMessages.length !== getMessagesAgain.length) {
		throw new ParseConfigException(commonErrorMessage + "The number of messages do not match.")
	}
	// check if the resources match
	for (const initialMessage of initialMessages) {
		// find the matching resource
		const matchingGetMessagesAgain = getMessagesAgain.find(
			(getMessageAgain) => getMessageAgain.languageTag === initialMessage.languageTag,
		)
		// check if the resource exists
		if (matchingGetMessagesAgain === undefined) {
			throw new ParseConfigException(
				commonErrorMessage +
					`Missing the message with id "${initialMessage.id}" and language tag "${initialMessage.languageTag}"`,
			)
		}
		// check if the messages are identical
		for (const [messageIndex, initialMessage] of initialMessages.entries()) {
			if (JSON.stringify(initialMessage) !== JSON.stringify(getMessagesAgain[messageIndex]))
				throw new ParseConfigException(
					dedent(`
${commonErrorMessage}
The messages with id "${initialMessage.id}" and language tag 
"${initialMessage.languageTag}" do not match".

Received:
${JSON.stringify(getMessagesAgain[messageIndex], undefined, 2)}

Expected:
${JSON.stringify(initialMessage, undefined, 2)}
`),
				)
		}
	}
}
