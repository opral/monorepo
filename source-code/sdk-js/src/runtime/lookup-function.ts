import type { Message, Resource } from "@inlang/core/ast"

type BaseArgs = Record<string, unknown> | never

type ConstructLookupFunctionArgs<Key, Args> = BaseArgs extends Args
	? [Key, Args?]
	: Args extends never
	? [Key]
	: [Key, Args]

type BaseLookupFunctionArgs = Record<string, BaseArgs>

export type LookupFunction<
	LookupFunctionArgs extends BaseLookupFunctionArgs = BaseLookupFunctionArgs,
> = <Key extends keyof LookupFunctionArgs>(
	...args: ConstructLookupFunctionArgs<Key, LookupFunctionArgs[Key]>
) => string

export const createLookupFunction = <
	LookupFn extends BaseLookupFunctionArgs = BaseLookupFunctionArgs,
>(
	resource: Resource,
): LookupFunction<LookupFn> =>
	((key, args) => {
		const message = resource.body.find((message) => message.id.name === key)
		if (!message) return ""

		return serializeMessage(message, args as BaseArgs)
	}) as LookupFunction<LookupFn>

const serializeMessage = (message: Message, args: BaseArgs): string => {
	if (!message) return ""

	return message.pattern.elements.map((element) => serializeElement(element, args)).join("")
}

const serializeElement = (
	element: Message["pattern"]["elements"][number],
	args: BaseArgs,
): string => {
	switch (element.type) {
		case "Text":
			return element.value
		case "Variable":
			return args[element.id.name] as string
	}
}
