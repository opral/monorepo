import type { Lix } from "@lix-js/sdk";
import { uuidV7 } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { generateText, stepCountIs } from "ai";

export type ChatMessage = {
	id: string;
	role: "system" | "user" | "assistant";
	content: string;
};

export async function sendMessageCore(args: {
	lix: Lix;
	model: LanguageModelV2;
	history: ChatMessage[];
	text: string;
	system?: string;
	setSystem?: (system?: string) => void;
	signal?: AbortSignal;
	tools: Record<string, any>;
	persistUser: (text: string) => Promise<void>;
	persistAssistant: (text: string) => Promise<void>;
}): Promise<{
	text: string;
	usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}> {
	const {
		lix,
		model,
		history,
		text,
		system,
		setSystem,
		signal,
		tools,
		persistUser,
		persistAssistant,
	} = args;

	let systemInstruction = system;
	if (system && setSystem) setSystem(system);

	history.push({ id: uuidV7({ lix }), role: "user", content: text });
	await persistUser(text);

	const mentionPaths = extractMentionPaths(text);
	const mentionGuidance =
		mentionPaths.length > 0
			? `File mentions like @<path> may refer to workspace files. If helpful, you can call the read_file tool with { path: "<path>" } to inspect content before answering. Only read files when needed.`
			: undefined;

	let stepNo = 0;
	const { text: reply, usage } = await generateText({
		model,
		system:
			mentionGuidance && systemInstruction
				? `${systemInstruction}\n\n${mentionGuidance}`
				: (mentionGuidance ?? systemInstruction),
		messages: toAiMessages(history),
		tools: tools as any,
		stopWhen: stepCountIs(5),
		prepareStep: async ({ messages }) => {
			if (messages.length > 20) {
				return { messages: messages.slice(-10) };
			}
			return {};
		},
		onStepFinish: ({
			toolCalls,
			toolResults,
			usage: stepUsage,
			finishReason,
			text,
		}) => {
			stepNo += 1;
			if (toolCalls.length > 0) {
				const names = toolCalls.map((c) => c.toolName).join(", ");
				console.log(`[LixAgent] Step ${stepNo}: tool call → ${names}`);
			}
			if (toolResults.length > 0) {
				const names = toolResults.map((r) => r.toolName).join(", ");
				console.log(`[LixAgent] Step ${stepNo}: tool result ← ${names}`);
			}
			if (text) {
				const preview = text.length > 120 ? text.slice(0, 117) + "..." : text;
				console.log(
					`[LixAgent] Step ${stepNo}: finish=${finishReason}, tokens in=${stepUsage.inputTokens ?? 0} out=${stepUsage.outputTokens ?? 0}. Text: ${preview}`
				);
			}
		},
		abortSignal: signal,
	});

	history.push({ id: uuidV7({ lix }), role: "assistant", content: reply });
	await persistAssistant(reply);
	return { text: reply, usage };
}

function toAiMessages(
	history: ChatMessage[]
): { role: "user" | "assistant"; content: string }[] {
	const out: { role: "user" | "assistant"; content: string }[] = [];
	for (const m of history) {
		if (m.role === "user" || m.role === "assistant")
			out.push({ role: m.role, content: m.content });
	}
	return out;
}

function extractMentionPaths(text: string): string[] {
	const out = new Set<string>();
	const re = /@([A-Za-z0-9_./-]+)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) {
		const p = m[1];
		if (p) out.add(p);
	}
	return [...out];
}
