import type { LanguageTag, Message, Pattern, VariableReference } from "@inlang/app"

type BaseArgs = Record<string, unknown> | never

type NarrowInlangFunctionArgs<Key, Args> = BaseArgs extends Args
	? [Key, Args?]
	: [Args] extends [never]
	? [Key]
	: [Key, Args]

export type InlangFunctionBaseArgs = Record<string, BaseArgs>

declare const translated: unique symbol
export type InlangString = string & { readonly [translated]: unknown }

export type InlangFunction<
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
> = <Key extends keyof InlangFunctionArgs>(
	...args: NarrowInlangFunctionArgs<Key, InlangFunctionArgs[Key]>
) => InlangString

export const createInlangFunction = <
	InlangFunctionArgs extends InlangFunctionBaseArgs = InlangFunctionBaseArgs,
>(
	messages: Message[],
	languageTag: LanguageTag,
): InlangFunction<InlangFunctionArgs> =>
	((key, args) => {
		const pattern = messages.find((message) => message.id === key)?.body[languageTag]?.[0]?.pattern
		if (!pattern) return ""

		return pattern.map((element) => serializeElement(element, args || {})).join("") as InlangString
	}) as InlangFunction<InlangFunctionArgs>

const serializeElement = (element: Pattern[number], args: BaseArgs): string => {
	switch (element.type) {
		case "Text":
			return element.value
		case "VariableReference": {
			return serializeVariableReference(element, args)
		}
	}
}

const serializeVariableReference = (
	variableReference: VariableReference,
	args: BaseArgs,
): string => {
	switch (variableReference.type) {
		case "VariableReference":
			return (args[variableReference.name] as string) ?? ""
	}
}
