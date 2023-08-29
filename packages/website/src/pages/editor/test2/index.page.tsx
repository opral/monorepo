import { createNodeishMemoryFs } from "@inlang-git/fs"
import {
	InlangConfig,
	Message,
	Plugin,
	openInlangProject,
	solidAdapter,
	InlangProjectWithSolidAdapter,
} from "@inlang/app"
import type { ImportFunction, InlangModule } from "@inlang/package"
import {
	createEffect,
	Show,
	createResource,
	from,
	observable,
	For,
	createSignal,
	Resource,
} from "solid-js"

export const Page = () => {
	const config: InlangConfig = {
		sourceLanguageTag: "en",
		languageTags: ["en"],
		modules: ["./dist/index.js"],
		settings: {
			"inlang.plugin.i18next": {
				options: {
					pathPattern: "./examples/example01/{languageTag}.json",
					variableReferencePattern: ["{", "}"],
				},
			},
		},
	}

	const mockPlugin: Plugin = {
		meta: {
			id: "inlang.plugin.i18next",
			description: { en: "Mock plugin description" },
			displayName: { en: "Mock Plugin" },
		},
		loadMessages: () => exampleMessages,
		saveMessages: () => undefined as any,
		addAppSpecificApi: () => ({
			"inlang.app.ide-extension": {
				messageReferenceMatcher: (text: string) => text as any,
			},
		}),
	}

	const exampleMessages: Message[] = [
		{
			id: "a",
			selectors: [],
			variants: [
				{
					languageTag: "en",
					match: {},
					pattern: [
						{
							type: "Text",
							value: "test",
						},
					],
				},
			],
		},
		{
			id: "b",
			selectors: [],
			variants: [
				{
					languageTag: "en",
					match: {},
					pattern: [
						{
							type: "Text",
							value: "test",
						},
					],
				},
			],
		},
	]

	const $import: ImportFunction = async () =>
		({
			default: {
				plugins: [mockPlugin],
			},
		} satisfies InlangModule)

	const [inlang] = createResource(async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile("/project.inlang.json", JSON.stringify(config))

		return solidAdapter(
			await openInlangProject({
				nodeishFs: fs,
				projectFilePath: "/project.inlang.json",
				_import: $import,
			}),
			{ from },
		) as InlangProjectWithSolidAdapter
	})
	// createEffect(() => {
	// 	if (!inlang.loading) {
	// 		console.debug("config changes", inlang()?.config())
	// 	}
	// })
	// createEffect(() => {
	// 	if (!inlang.loading) {
	// 		console.debug("meta plugins changes", inlang()!.installed.plugins()[0]?.meta.id)
	// 	}
	// })
	createEffect(() => {
		if (!inlang.loading) {
			console.info("messages change", inlang()!.query.messages.includedMessageIds() || [])
		}
	})

	createEffect(() => {
		if (!inlang.loading) {
			inlang()!.query.messages.get.subscribe({ where: { id: "d" } }, (message) =>
				console.debug(message),
			)
		}
	})

	// setTimeout(() => {
	// 	console.info("timeout set config")
	// 	inlang()?.setConfig({
	// 		...config,
	// 		sourceLanguageTag: "fr",
	// 	})
	// }, 2000)

	setTimeout(() => {
		console.info("timeout createMessage")
		if (!inlang.loading) {
			inlang()!.query.messages.create({
				data: {
					...exampleMessages[0],
					id: "d",
				} as Message,
			})
		}
	}, 4000)

	return (
		<div>
			<Show when={!inlang.loading} fallback={<div>loading</div>}>
				<div>{inlang()!.config()?.sourceLanguageTag}</div>
				<For each={inlang()!.query.messages.includedMessageIds()}>
					{(id) => {
						return <MessageConponent id={id} inlang={inlang()!} />
					}}
				</For>
			</Show>
		</div>
	)
}

const MessageConponent = (args: { id: string; inlang: InlangProjectWithSolidAdapter }) => {
	const [message, setMessage] = createSignal<Message | undefined>(undefined)

	createEffect(() => {
		args.inlang.query.messages.get.subscribe({ where: { id: args.id } }, (message) =>
			setMessage(message),
		)
	})

	createEffect(() => {
		console.debug(message())
	})

	return (
		<div>
			<div>{message()?.id}</div>
			<div>{message()?.variants[0]?.pattern[0].value}</div>
		</div>
	)
}
