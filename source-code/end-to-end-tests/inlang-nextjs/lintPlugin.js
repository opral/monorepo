// src/rules/emptyPattern/emptyPattern.ts
var emptyPatternRule = {
	type: "MessageLint",
	meta: {
		id: "inlang.lintRule.emptyPattern",
		displayName: {
			en: "Empty Pattern",
		},
		description: {
			en: `
Checks for empty pattern in a language tag.

If a message exists in the reference resource but the pattern
in a target resource is empty, it is likely that the message has not
been translated yet.
`,
		},
		marketplace: {
			icon: "https://raw.githubusercontent.com/inlang/inlang/main/source-code/plugins/standard-lint-rules/assets/icon.png",
			linkToReadme: {
				en: "https://github.com/inlang/inlang/tree/main/source-code/plugins/standard-lint-rules",
			},
			keywords: ["lint-rule", "standard", "empty-pattern"],
			publisherName: "inlang",
			publisherIcon: "https://inlang.com/favicon/safari-pinned-tab.svg",
		},
	},
	message: ({ message: { id, variants }, languageTags, sourceLanguageTag, report }) => {
		const translatedLanguageTags = languageTags.filter(
			(languageTag) => languageTag !== sourceLanguageTag,
		)
		for (const translatedLanguageTag of translatedLanguageTags) {
			const filteredVariants =
				variants.filter((variant) => variant.languageTag === translatedLanguageTag) ?? []
			if (filteredVariants.length === 0) return
			const patterns = filteredVariants.flatMap(({ pattern }) => pattern)
			if (!patterns.length) {
				report({
					messageId: id,
					languageTag: translatedLanguageTag,
					body: {
						en: `Message with id '${id}' has no patterns for language tag '${translatedLanguageTag}'.`,
					},
				})
			} else if (
				patterns.length === 1 &&
				patterns[0]?.type === "Text" &&
				patterns[0]?.value === ""
			) {
				report({
					messageId: id,
					languageTag: translatedLanguageTag,
					body: {
						en: `Message with id '${id}' has no content for language tag '${translatedLanguageTag}'.`,
					},
				})
			}
		}
	},
}

// src/rules/identicalPattern/identicalPattern.ts
var identicalPatternRule = {
	type: "MessageLint",
	meta: {
		id: "inlang.lintRule.identicalPattern",
		displayName: {
			en: "Identical Pattern",
		},
		description: {
			en: `
Checks for identical patterns in different languages.

A message with identical wording in multiple languages can indicate
that the translations are redundant or can be combined into a single
message to reduce translation effort.
`,
		},
		marketplace: {
			icon: "https://raw.githubusercontent.com/inlang/inlang/main/source-code/plugins/standard-lint-rules/assets/icon.png",
			linkToReadme: {
				en: "https://github.com/inlang/inlang/tree/main/source-code/plugins/standard-lint-rules",
			},
			keywords: ["lint-rule", "standard", "identical-pattern"],
			publisherName: "inlang",
			publisherIcon: "https://inlang.com/favicon/safari-pinned-tab.svg",
		},
	},
	message: ({ message: { id, variants }, sourceLanguageTag, report, settings }) => {
		const referenceVariant = variants.find((variant) => variant.languageTag === sourceLanguageTag)
		if (referenceVariant === void 0) return
		const translatedVariants = variants.filter(
			(variant) => variant.languageTag !== sourceLanguageTag,
		)
		for (const variant of translatedVariants) {
			const isMessageIdentical =
				messageVariantToString(referenceVariant) === messageVariantToString(variant)
			const shouldBeIgnored = settings.ignore?.includes(patternToString(referenceVariant.pattern))
			if (isMessageIdentical && !shouldBeIgnored) {
				report({
					messageId: id,
					languageTag: variant.languageTag,
					body: {
						en: `Identical content found in language '${variant.languageTag}' with message ID '${id}'.`,
					},
				})
			}
		}
	},
}
var messageVariantToString = (variant) => {
	const variantWithoutLanguageTag = { ...variant, languageTag: void 0 }
	return JSON.stringify(variantWithoutLanguageTag)
}
var patternToString = (pattern) =>
	pattern
		.filter((pattern2) => pattern2.type === "Text")
		.map((part) => part.value)
		.join("")

// src/rules/messageWithoutSource/messageWithoutSource.ts
var messageWithoutSourceRule = {
	type: "MessageLint",
	meta: {
		id: "inlang.lintRule.messageWithoutSource",
		displayName: {
			en: "Message Without Source",
		},
		description: {
			en: `
Checks for likely outdated messages.

A message with a missing source is usually an indication that
the message (id) is no longer used in source code, but messages
have not been updated accordingly.
`,
		},
		marketplace: {
			icon: "https://raw.githubusercontent.com/inlang/inlang/main/source-code/plugins/standard-lint-rules/assets/icon.png",
			linkToReadme: {
				en: "https://github.com/inlang/inlang/tree/main/source-code/plugins/standard-lint-rules",
			},
			keywords: ["lint-rule", "standard", "message-without-source"],
			publisherName: "inlang",
			publisherIcon: "https://inlang.com/favicon/safari-pinned-tab.svg",
		},
	},
	message: ({ message: { id, variants }, sourceLanguageTag, report }) => {
		if (!variants.some((variant) => variant.languageTag === sourceLanguageTag)) {
			report({
				messageId: id,
				languageTag: sourceLanguageTag,
				body: {
					en: `Message with id '${id}' is specified, but missing in the source.`,
				},
			})
		}
	},
}

// src/rules/missingTranslation/missingTranslation.ts
var missingTranslationRule = {
	type: "MessageLint",
	meta: {
		id: "inlang.lintRule.missingTranslation",
		displayName: {
			en: "Missing Translation",
		},
		description: {
			en: `
Checks for missing variants for a specific languageTag.

If a variant exists for the sourceLanguageTag but is missing
for a listed languageTag, it is likely that the message has not
been translated for this languageTag yet.
`,
		},
		marketplace: {
			icon: "https://raw.githubusercontent.com/inlang/inlang/main/source-code/plugins/standard-lint-rules/assets/icon.png",
			linkToReadme: {
				en: "https://github.com/inlang/inlang/tree/main/source-code/plugins/standard-lint-rules",
			},
			keywords: ["lint-rule", "standard", "missing-translation"],
			publisherName: "inlang",
			publisherIcon: "https://inlang.com/favicon/safari-pinned-tab.svg",
		},
	},
	message: ({ message: { id, variants }, languageTags, sourceLanguageTag, report }) => {
		const translatedLanguageTags = languageTags.filter(
			(languageTag) => languageTag !== sourceLanguageTag,
		)
		for (const translatedLanguageTag of translatedLanguageTags) {
			const filteredVariants =
				variants.filter((variant) => variant.languageTag === translatedLanguageTag) ?? []
			if (!filteredVariants.length) {
				report({
					messageId: id,
					languageTag: translatedLanguageTag,
					body: {
						en: `Message with id '${id}' has a missing variant for language tag '${translatedLanguageTag}'.`,
					},
				})
			}
		}
		return
	},
}

// src/index.ts
var src_default = {
	lintRules: [
		emptyPatternRule,
		identicalPatternRule,
		messageWithoutSourceRule,
		missingTranslationRule,
	],
}
export { src_default as default }
