import { uuidV7, type Lix } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { type AgentConversation, type ChangeProposalSummary } from "./types.js";
import { ContextStore } from "./context/context-store.js";
import { DEFAULT_SYSTEM_PROMPT } from "./system-prompt.js";
import { createAgentToolSet, type AgentToolSet } from "./tools/index.js";
import { ProposalModeController } from "./proposal-mode.js";

/**
 * Handle returned by {@link createLixAgent}.
 */
export type Agent = {
	lix: Lix;
	model: LanguageModelV2;
	/** Shared tool set scoped to this agent instance. */
	tools: AgentToolSet;
	setContext(key: string, value: string): void;
	getContext(key: string): string | undefined;
	getSystemPrompt(): string;
	setSystemPrompt(value: string): void;
	getContextSnapshot(): Record<string, string>;
};

type AgentState = {
	conversation: AgentConversation;
	contextStore: ContextStore;
	systemPrompt: string;
	tools: AgentToolSet;
	proposal: ProposalModeController;
};

const agentStates = new WeakMap<Agent, AgentState>();

/**
 * @internal Helper to access private state for agent utilities.
 */
export function getAgentState(agent: Agent): AgentState {
	const state = agentStates.get(agent);
	if (!state) {
		throw new Error("Agent state is unavailable. Use createLixAgent.");
	}
	return state;
}

/**
 * Create a Lix agent handle that wraps Lix SDK interactions.
 *
 * Provide `systemPrompt` to override the default instructions. Use
 * {@link appendDefaultSystemPrompt} to extend the default prompt with
 * additional guidance while keeping core behaviors.
 *
 * @example
 * import { createLixAgent, appendDefaultSystemPrompt } from "@lix-js/agent-sdk";
 *
 * const agent = await createLixAgent({
 * 	lix,
 * 	model,
 * 	systemPrompt: appendDefaultSystemPrompt("You are using flashtype..."),
 * });
 *
 * await agent.tools.write_file.execute({
 * 	version_id: "version-id",
 * 	path: "/notes.txt",
 * 	content: "Hello from the agent!",
 * });
 */
export async function createLixAgent(args: {
	lix: Lix;
	model: LanguageModelV2;
	systemPrompt?: string;
}): Promise<Agent> {
	const { lix, model, systemPrompt: providedSystemPrompt } = args;

	const state: AgentState = {
		conversation: { id: await uuidV7({ lix }), messages: [] },
		contextStore: new ContextStore(),
		tools: createAgentToolSet({ lix }),
		systemPrompt: providedSystemPrompt ?? DEFAULT_SYSTEM_PROMPT,
		proposal: new ProposalModeController(lix),
	};

	const wrapToolForReview = (toolName: keyof AgentToolSet) => {
		const tool = state.tools[toolName] as any;
		if (!tool || typeof tool.execute !== "function") return;
		const originalExecute = tool.execute.bind(tool);
		tool.execute = async (...args: any[]) => {
			const [input, context, ...rest] = args;
			if (!state.proposal.isActive()) {
				return originalExecute(input, context, ...rest);
			}
			return state.proposal.interceptToolCall({
				toolName: String(toolName),
				toolCallId:
					context && typeof context?.toolCallId === "string"
						? context.toolCallId
						: undefined,
				toolInput: (input ?? {}) as Record<string, unknown>,
				executeOriginal: (patchedInput) =>
					originalExecute(patchedInput, context, ...rest),
			});
		};
	};

	wrapToolForReview("write_file");
	wrapToolForReview("delete_file");

	const agent: Agent = {
		lix,
		model,
		tools: state.tools,
		setContext: (key: string, value: string) => {
			state.contextStore.set(key, value);
		},
		getContext: (key: string) => state.contextStore.get(key),
		getSystemPrompt: () => state.systemPrompt,
		setSystemPrompt: (value: string) => {
			state.systemPrompt = value;
		},
		getContextSnapshot: () => state.contextStore.toObject(),
	};

	agentStates.set(agent, state);

	return agent;
}

/**
 * Retrieve the currently staged change proposal summary for the given proposal id.
 *
 * Returns `null` when the proposal is not pending review.
 */
export function getChangeProposalSummary(
	agent: Agent,
	proposalId: string
): ChangeProposalSummary | null {
	const state = getAgentState(agent);
	return state.proposal.getPendingSummary(proposalId);
}

// KV-based hydration removed; using threads instead
