import type { Expression, Message, Placeholder, Resource } from "@inlang/core/ast"

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
			.map((element) => serializeElement(element, args as BaseArgs))
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
			return serializePlaceholder(element.placeholder, args)
		}
	}
}

const serializePlaceholder = (placeholder: Placeholder["placeholder"], args: BaseArgs): string => {
	switch (placeholder.type) {
		case "Expression":
			return serializeExpression(placeholder.expression, args)
	}
}

const serializeExpression = (expression: Expression["expression"], args: BaseArgs): string => {
	switch (expression.type) {
		case "Variable":
			return args[expression.name] as string
	}
}
