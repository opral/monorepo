import type { Expression, Message, Placeholder, Resource } from "@inlang/core/ast"

type BaseArgs = Record<string, unknown> | never

type ConstructLookupFunctionArgs<Key, Args> = BaseArgs extends Args
	? [Key, Args?]
	: [Args] extends [never]
	? [Key]
	: [Key, Args]

export type BaseLookupFunctionArgs = Record<string, BaseArgs>

export type LookupFunction<
	LookupFunctionArgs extends BaseLookupFunctionArgs = BaseLookupFunctionArgs,
> = <Key extends keyof LookupFunctionArgs>(
	...args: ConstructLookupFunctionArgs<Key, LookupFunctionArgs[Key]>
) => string

export const createLookupFunction = <
	LookupFunctionArgs extends BaseLookupFunctionArgs = BaseLookupFunctionArgs,
>(
	resource: Resource,
): LookupFunction<LookupFunctionArgs> =>
	((key, args) => {
		const message = resource.body.find((message) => message.id.name === key)
		if (!message) return ""

		return message.pattern.elements
			.map((element) => serializeElement(element, args as BaseArgs))
			.join("")
	}) as LookupFunction<LookupFunctionArgs>

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
