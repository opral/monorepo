// @ts-nocheck
import { serializedPattern } from "./serializePattern.js";

export const serializeMessage = (
	message: Message
): Record<LanguageTag, string> => {
	const result: Record<LanguageTag, string> = {};
	for (const variant of message.variants) {
		if (result[variant.languageTag] !== undefined) {
			throw new Error(
				`The message "${message.id}" has multiple variants for the language tag "${variant.languageTag}". The inlang-message-format plugin does not support multiple variants for the same language tag at the moment.`
			);
		}
		result[variant.languageTag] = serializedPattern(variant.pattern);
	}
	return result;
};
