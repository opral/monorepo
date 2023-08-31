import type { InlangProject, LintReportsQueryApi } from "../api.js"
import { observable, type from as solidFrom } from "../solid.js"
import type { MessageQueryApi } from "@inlang/sdk"

export const solidAdapter = (
	project: InlangProject,
	arg: {
		from: typeof solidFrom
	},
): InlangProjectWithSolidAdapter => {
	const convert = <T>(signal: () => T): (() => T) => {
		return arg.from(observable(signal)) as () => T
	}

	return {
		appSpecificApi: convert(project.appSpecificApi),
		config: convert(project.config),
		errors: convert(project.errors),
		installed: {
			lintRules: convert(project.installed.lintRules),
			plugins: convert(project.installed.plugins),
		},
		setConfig: project.setConfig,
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
			lintReports: {
				get: project.query.lintReports.get,
				getAll: convert(project.query.lintReports.getAll),
			},
		},
	} satisfies InlangProjectWithSolidAdapter
}

export type InlangProjectWithSolidAdapter = {
	appSpecificApi: () => ReturnType<InlangProject["appSpecificApi"]>
	installed: {
		plugins: () => ReturnType<InlangProject["installed"]["plugins"]>
		lintRules: () => ReturnType<InlangProject["installed"]["lintRules"]>
	}
	errors: () => ReturnType<InlangProject["errors"]>
	config: () => ReturnType<InlangProject["config"]>
	setConfig: InlangProject["setConfig"]
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
		lintReports: {
			get: LintReportsQueryApi["get"]
			getAll: () => ReturnType<LintReportsQueryApi["getAll"]>
		}
	}
}

// const x = {} as InlangProjectWithSolidAdapter
// x.query.lintReports.getAll()

// console.log(await x.lint())
