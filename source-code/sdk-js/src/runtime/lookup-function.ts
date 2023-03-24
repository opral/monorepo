import type { Message, Resource } from "@inlang/core/ast"

// TODO: do we want to introduce a opaque type for Language?

const cache = new Map<string, Resource>()

export const createLookupFunctionForLanguage = (language: string) => {
	const resource = cache.get(language)
	if (!resource) return () => ""

	return createLookupFunction(resource)
}

// ------------------------------------------------------------------------------------------------

type BaseArgs = Record<string, unknown> | never

type ConstructLookupFunctionArgs<Key, Args> = BaseArgs extends Args
	? [Key, Args?]
	: Args extends never
	? [Key]
	: [Key, Args]

type BaseLookupFunctionArgs = Record<string, BaseArgs>

type LookupFunction<LookupFunctionArgs extends BaseLookupFunctionArgs> = <
	Key extends keyof LookupFunctionArgs,
>(
	...args: ConstructLookupFunctionArgs<Key, LookupFunctionArgs[Key]>
) => string

export const createLookupFunction = <LookupFn extends BaseLookupFunctionArgs>(
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
