import type { Message, Resource } from "@inlang/core/ast"

// TODO: do we want to introduce a opaque type for Language?

const cache = new Map<string, Resource>()

const createLookupFunctionForLanguage = (language: string) =>
	createLookupFunction(cache.get(language))

type BaseArgs = Record<string, unknown> | never

type LookupFunctionArgs<Key, Args> = Args extends BaseArgs ? [Key, Args] : [Key]

type BaseLookupFn = Record<string, BaseArgs>

type LookupFunction<LookupFn extends BaseLookupFn> = <Key extends keyof LookupFn>(
	...args: LookupFunctionArgs<Key, LookupFn[Key]>
) => string

const createLookupFunction =
	<Fns extends BaseLookupFn>(resource: Resource | undefined): LookupFunction<Fns> =>
	(key, args) =>
		serializeMessage(
			resource?.body.find((message) => message.id.name === key),
			args,
		)

const serializeMessage = (message: Message | undefined, args: BaseArgs): string => {
	if (!message) return ""

	// TODO: replace args
	return message.pattern.elements.join("")
}
