import { createNodeishMemoryFs } from "@lix-js/fs"
import {
	InlangConfig,
	Message,
	Plugin,
	openInlangProject,
	solidAdapter,
	InlangProjectWithSolidAdapter,
	LintRule,
	LintReport,
} from "@inlang/app"
import type { ImportFunction, InlangPackage } from "@inlang/package"
import { createEffect, Show, createResource, from, For, createSignal } from "solid-js"
import lintRuleFile from "./../../../../../plugins/standard-lint-rules/dist/index.js"

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
			{
				languageTag: "de",
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

export const Page = () => {
	const config: InlangConfig = {
		sourceLanguageTag: "en",
		languageTags: ["en"],
		packages: ["./dist/index.js"],
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

	const $import: ImportFunction = async () =>
		({
			default: {
				plugins: [mockPlugin],
				lintRules: lintRuleFile.lintRules as LintRule[],
			},
		} satisfies InlangPackage)

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
			console.info("all messages", inlang()!.query.messages.getAll())
		}
	})

	const createMessage = () => {
		console.info("createMessage")
		if (!inlang.loading) {
			inlang()!.query.messages.create({
				data: {
					...exampleMessages[0],
					id: "d",
				} as Message,
			})
		}
	}

	const updateMessage = () => {
		console.info("updateMessage")
		if (!inlang.loading) {
			inlang()!.query.messages.update({
				where: { id: "a" },
				data: {
					...exampleMessages[0],
					variants: [
						{
							match: {},
							languageTag: "en",
							pattern: [
								{
									type: "Text",
									value: "updated",
								},
							],
						},
					],
				} as Message,
			})
		}
	}

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
			<button onClick={() => createMessage()}>Create message d</button>
			<button onClick={() => updateMessage()}>Change message a</button>
		</div>
	)
}

const MessageConponent = (args: { id: string; inlang: InlangProjectWithSolidAdapter }) => {
	const [message, setMessage] = createSignal<Message | undefined>(undefined)
	const [lintReports, setLintReports] = createSignal<LintReport[]>([])

	createEffect(() => {
		args.inlang.query.messages.get.subscribe({ where: { id: args.id } }, (message) =>
			setMessage(message),
		)
	})

	createEffect(() => {
		args.inlang.query.lintReports.get.subscribe(
			{ where: { messageId: args.id } },
			(lintReports) => {
				if (lintReports && lintReports.length > 0) {
					setLintReports(lintReports)
				}
			},
		)
	})

	createEffect(() => {
		console.log("message", message())
	})
	createEffect(() => {
		console.log("reports", message()?.id, lintReports())
	})

	return (
		<div>
			<div>{message()?.id}</div>
			<div>{message()?.variants[0]?.pattern[0].value}</div>
		</div>
	)
}
