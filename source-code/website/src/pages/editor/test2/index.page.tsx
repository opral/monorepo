import { createNodeishMemoryFs } from "@inlang-git/fs"
import {
	InlangConfig,
	LintRule,
	Message,
	Plugin,
	createInlang,
	withSolidReactivity,
} from "@inlang/app"
import type { ImportFunction, InlangModule } from "@inlang/module"
import { createEffect, Show, createResource, from } from "solid-js"

export const Page = () => {
	const config: InlangConfig = {
		sourceLanguageTag: "en",
		languageTags: ["en"],
		modules: ["./dist/index.js"],
		settings: {
			plugins: {
				"inlang.plugin.i18next": {
					options: {
						pathPattern: "./examples/example01/{languageTag}.json",
						variableReferencePattern: ["{", "}"],
					},
				},
			},
			lintRules: {
				"inlang.missingMessage": {
					level: "error",
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
			body: {
				en: [
					{
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
		},
		{
			id: "b",
			selectors: [],
			body: {
				en: [
					{
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
		},
	]

	const mockLintRule: LintRule = {
		meta: {
			id: "mock.lint-rule",
			description: { en: "Mock lint rule description" },
			displayName: { en: "Mock Lint Rule" },
		},
	}

	const $import: ImportFunction = async () =>
		({
			default: {
				plugins: [mockPlugin],
				lintRules: [mockLintRule],
			},
		} satisfies InlangModule)

	const [inlang] = createResource(async () => {
		const fs = createNodeishMemoryFs()
		await fs.writeFile("/inlang.config.json", JSON.stringify(config))
		return withSolidReactivity(
			createInlang({
				nodeishFs: fs,
				configPath: "/inlang.config.json",
				_import: $import,
			}),
			from,
		)
	})
	createEffect(() => {
		if (!inlang.loading) {
			console.log("config changes", inlang()?.config())
		}
	})
	createEffect(() => {
		if (!inlang.loading) {
			console.log("meta plugins changes", inlang()!.meta.plugins()[0]?.id)
		}
	})
	createEffect(() => {
		if (!inlang.loading) {
			console.log("messages changes", inlang()!.query.messages.getAll())
		}
	})

	setTimeout(() => {
		console.log("timeout set config")
		inlang()?.setConfig({
			...config,
			sourceLanguageTag: "fr",
		})
	}, 2000)

	setTimeout(() => {
		console.log("timeout createMessage")
		inlang()?.query.messages.create({
			data: {
				...exampleMessages[0],
				id: "d",
			} as Message,
		})
	}, 4000)

	return (
		<div>
			<Show when={!inlang.loading} fallback={<div>loading</div>}>
				<div>{inlang()!.config()?.sourceLanguageTag}</div>
				<div>{inlang()!.meta.plugins()[0]?.id}</div>
			</Show>
		</div>
	)
}
