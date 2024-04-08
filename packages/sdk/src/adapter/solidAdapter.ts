import type { InlangProject, MessageLintReportsQueryApi } from "../api.js"
import { observable, type from as solidFrom } from "../reactivity/solid.js"
import type { MessageQueryApi } from "@inlang/sdk"

export const solidAdapter = (
	project: InlangProject,
	arg: {
		from: typeof solidFrom
	}
): InlangProjectWithSolidAdapter => {
	const convert = <T>(signal: () => T): (() => T) => {
		return arg.from(observable(signal)) as () => T
	}

	return {
		id: project.id,
		customApi: convert(project.customApi),
		settings: convert(project.settings),
		errors: convert(project.errors),
		installed: {
			messageLintRules: convert(project.installed.messageLintRules),
			plugins: convert(project.installed.plugins),
		},
		setSettings: project.setSettings,
		query: {
			messages: {
				create: project.query.messages.create,
				update: project.query.messages.update,
				delete: project.query.messages.delete,
				upsert: project.query.messages.upsert,
				get: project.query.messages.get,
				// get: (args) => {
				// 	const [message, setMessage] = createSignal<Message | undefined>()
				// 	project.query.messages.get.subscribe(args, setMessage)
				// 	return message()
				// },
				getAll: convert(project.query.messages.getAll),
				includedMessageIds: convert(project.query.messages.includedMessageIds),
			},
			messageLintReports: {
				get: project.query.messageLintReports.get,
				getAll: project.query.messageLintReports.getAll,
			},
		},
	} satisfies InlangProjectWithSolidAdapter
}

export type InlangProjectWithSolidAdapter = {
	id: InlangProject["id"]
	customApi: () => ReturnType<InlangProject["customApi"]>
	installed: {
		plugins: () => ReturnType<InlangProject["installed"]["plugins"]>
		messageLintRules: () => ReturnType<InlangProject["installed"]["messageLintRules"]>
	}
	errors: () => ReturnType<InlangProject["errors"]>
	settings: () => ReturnType<InlangProject["settings"]>
	setSettings: InlangProject["setSettings"]
	query: {
		messages: {
			create: MessageQueryApi["create"]
			update: MessageQueryApi["update"]
			delete: MessageQueryApi["delete"]
			upsert: MessageQueryApi["upsert"]
			get: MessageQueryApi["get"]
			//get: (args: Parameters<MessageQueryApi["get"]>[0]) => ReturnType<MessageQueryApi["get"]>
			getAll: () => ReturnType<MessageQueryApi["getAll"]>
			includedMessageIds: () => ReturnType<MessageQueryApi["includedMessageIds"]>
		}
		messageLintReports: {
			get: MessageLintReportsQueryApi["get"]
			getAll: () => ReturnType<MessageLintReportsQueryApi["getAll"]>
		}
	}
}

// const x = {} as InlangProjectWithSolidAdapter
// x.query.lintReports.getAll()

// console.log(await x.lint())
