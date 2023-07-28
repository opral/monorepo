import type { Message, Placeholder, Resource } from "@inlang/core/ast"

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
	resource: Resource,
): InlangFunction<InlangFunctionArgs> =>
	((key, args) => {
		const message = resource.body.find((message) => message.id.name === key)
		if (!message) return ""

		return message.pattern.elements
			.map((element) => serializeElement(element, args || {}))
			.join("") as InlangString
	}) as InlangFunction<InlangFunctionArgs>

const serializeElement = (
	element: Message["pattern"]["elements"][number],
	args: BaseArgs,
): string => {
	switch (element.type) {
		case "Text":
			return element.value
		case "Placeholder": {
			return serializePlaceholder(element, args)
		}
	}
}

const serializePlaceholder = (placeholder: Placeholder, args: BaseArgs): string => {
	switch (placeholder.body.type) {
		case "VariableReference":
			return (args[placeholder.body.name] as string) ?? ""
	}
}
