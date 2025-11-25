import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	Suspense,
} from "react";
import { Bot } from "lucide-react";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { LixProvider, useLix, useQuery } from "@lix-js/react-utils";
import {
	acceptChangeProposal,
	createConversation,
	selectVersionDiff,
	rejectChangeProposal,
} from "@lix-js/sdk";
import {
	ChangeProposalRejectedError,
	createLixAgent,
	getChangeProposalSummary,
	type AgentConversationMessage,
	type AgentEvent,
	type Agent as LixAgent,
	type ChangeProposalSummary,
	sendMessage,
} from "@lix-js/agent-sdk";
import { fromPlainText, toPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import type {
	ViewContext,
	ViewInstance,
	DiffViewConfig,
	RenderableDiff,
} from "../../app/types";
import ConversationMessage from "./conversation-message";
import { COMMANDS } from "./commands/index";
import { selectFilePaths } from "./select-file-paths";
import { clearConversation as runClearConversation } from "./commands/clear";
import { createReactViewDefinition } from "../../app/react-view";
import { systemPrompt } from "./system-prompt";
import { ChangeDecisionOverlay } from "./components/change-decision";
import { PromptComposer } from "./components/prompt-composer";
import { VITE_DEV_OPENROUTER_API_KEY } from "@/env-variables";
import { useKeyValue } from "@/hooks/key-value/use-key-value";
import { WelcomeScreen } from "./components/welcome-screen";
import {
	AGENT_VIEW_KIND,
	DIFF_VIEW_KIND,
	FILE_VIEW_KIND,
	buildDiffViewProps,
	buildFileViewProps,
	diffViewInstance,
	fileViewInstance,
} from "../../app/view-instance-helpers";

type AgentViewLaunchProps = {
	readonly initialMessage?: string;
	readonly invocationId?: string;
	readonly source?: string;
};

type AgentViewProps = {
	readonly context?: ViewContext;
	readonly instance?: ViewInstance;
};

export const CONVERSATION_KEY = "flashtype_agent_conversation_id";
const DEFAULT_MODEL_ID = "z-ai/glm-4.6";
const AVAILABLE_MODELS = [
        { id: "anthropic/claude-4.5-sonnet", label: "Claude 4.5 Sonnet" },
        { id: "google/gemini-3-pro-preview", label: "Gemini 3 Pro Preview" },
        { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
        { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
        { id: "z-ai/glm-4.6", label: "GLM 4.6 by ZAI" },
        { id: "x-ai/grok-code-fast-1", label: "Grok Code Fast 1" },
        { id: "openai/gpt-5", label: "GPT-5" },
	{ id: "openai/gpt-5-codex", label: "GPT-5 Codex" },
] as const;
const OPENROUTER_KEY_STORAGE_KEY = "flashtype_agent_openrouter_api_key";

/**
 * Agent chat view backed by the real Lix agent.
 *
 * The composer retains the prototype UX (slash commands, mentions) while
 * delegating message handling to the agent SDK. Tool executions stream into
 * the transcript via the existing tool run visualization.
 *
 * @example
 * <AgentView />
 */
export function AgentView({ context, instance }: AgentViewProps) {
	const lix = useLix();
	const devApiKey =
		VITE_DEV_OPENROUTER_API_KEY && VITE_DEV_OPENROUTER_API_KEY.trim().length > 0
			? VITE_DEV_OPENROUTER_API_KEY.trim()
			: null;
	const usingDevApiKey = Boolean(devApiKey);

	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [conversationId, setConversationId] = useKeyValue(CONVERSATION_KEY);
	const conversationInitRef = useRef<Promise<string> | null>(null);

	const [storedApiKey, setStoredApiKey] = useState<string | null>(devApiKey);
	const [apiKeyDraft, setApiKeyDraft] = useState(devApiKey ?? "");
	const [keyLoaded, setKeyLoaded] = useState(usingDevApiKey);
	const [storedModel, setStoredModel] = useKeyValue("flashtype_agent_model");
	const [autoAcceptRaw, setAutoAccept] = useKeyValue(
		"flashtype_auto_accept_session",
	);
	const selectedModelId = useMemo(() => {
		if (!storedModel) return DEFAULT_MODEL_ID;
		const match = AVAILABLE_MODELS.find((option) => option.id === storedModel);
		return match ? match.id : DEFAULT_MODEL_ID;
	}, [storedModel]);
	const autoAcceptEnabled = Boolean(autoAcceptRaw);

	useEffect(() => {
		if (!storedModel) return;
		const match = AVAILABLE_MODELS.some((option) => option.id === storedModel);
		if (!match) {
			void setStoredModel(DEFAULT_MODEL_ID);
		}
	}, [storedModel, setStoredModel]);

	useEffect(() => {
		console.log("[AgentView] conversationId changed", conversationId);
	}, [conversationId]);

	const ensureConversationId = useCallback(async () => {
		if (conversationId) return conversationId;
		if (!conversationInitRef.current) {
			conversationInitRef.current = (async () => {
				console.log("[AgentView] Initializing conversation...");
				try {
					const conversation = await createConversation({ lix });
					console.log("[AgentView] Created conversation", conversation.id);
					await setConversationId(conversation.id);
					console.log("[AgentView] Set conversationId", conversation.id);
					return conversation.id;
				} catch (err) {
					console.error("[AgentView] Failed to create conversation", err);
					throw err;
				} finally {
					conversationInitRef.current = null;
				}
			})();
		}
		return await conversationInitRef.current;
	}, [conversationId, lix, setConversationId]);

	useEffect(() => {
		// Skip for import sessions - they use importConversationId instead
		const hasInvocationId = Boolean(
			(instance?.launchArgs as AgentViewLaunchProps | undefined)?.invocationId,
		);
		if (hasInvocationId) return;
		if (conversationId) return;
		const timer = setTimeout(() => {
			void ensureConversationId();
		}, 100);
		return () => clearTimeout(timer);
	}, [conversationId, ensureConversationId, instance?.launchArgs]);

	useEffect(() => {
		if (devApiKey) {
			setStoredApiKey(devApiKey);
			setApiKeyDraft(devApiKey);
			setKeyLoaded(true);
			return;
		}
		if (typeof window === "undefined") {
			setKeyLoaded(true);
			return;
		}
		const existing = window.localStorage.getItem(OPENROUTER_KEY_STORAGE_KEY);
		if (existing) {
			setStoredApiKey(existing);
			setApiKeyDraft(existing);
		}
		setKeyLoaded(true);
	}, [devApiKey]);

	const [pendingProposal, setPendingProposal] = useState<{
		proposalId: string;
		summary?: string;
		details?: ChangeProposalSummary | null;
		accept: () => Promise<void>;
		reject: (reason?: string) => Promise<void>;
		diffInstance?: string;
	} | null>(null);
	const clearPendingProposal = useCallback(() => {
		setPendingProposal((prev) => {
			if (context && prev?.diffInstance) {
				context.closeView?.({ instance: prev.diffInstance });
			}
			return null;
		});
	}, [context]);
	const [notice, setNotice] = useState<string | null>(null);
	const isFirstProposalRef = useRef(true);
	const resolvedProposalIdsRef = useRef<Set<string>>(new Set());
	const suppressedProposalErrorRef = useRef<string | null>(null);
	const handleAutoAcceptToggle = useCallback(
		async (next: boolean) => {
			await setAutoAccept(next);
			setNotice(null);
		},
		[setAutoAccept, setNotice],
	);

	useEffect(() => {
		if (!autoAcceptEnabled) return;
		clearPendingProposal();
	}, [autoAcceptEnabled, clearPendingProposal]);

	const provider = useMemo(() => {
		if (!storedApiKey) return null;
		return createOpenRouter({
			apiKey: storedApiKey,
		});
	}, [storedApiKey]);

	const model = useMemo(
		() => (provider ? provider(selectedModelId) : null),
		[provider, selectedModelId],
	);
	const hasKey = Boolean(storedApiKey);
	const launchProps = instance?.launchArgs as AgentViewLaunchProps | undefined;

	// Track processed invocationId to avoid re-creating conversation
	const processedInvocationIdRef = useRef<string | null>(null);
	// Local conversation ID for import sessions (doesn't affect global state)
	const [importConversationId, setImportConversationId] = useState<
		string | null
	>(null);

	// Create fresh conversation when opened from import with invocationId
	useEffect(() => {
		if (!launchProps?.invocationId) return;
		if (processedInvocationIdRef.current === launchProps.invocationId) return;
		processedInvocationIdRef.current = launchProps.invocationId;

		createConversation({ lix }).then((conversation) => {
			// Use local state for import sessions, don't touch global conversationId
			setImportConversationId(conversation.id);
		});
	}, [launchProps?.invocationId, lix]);

	// Use import-specific conversation if available, otherwise use global
	const activeConversationId = importConversationId ?? conversationId;

	const messages = useQuery(({ lix }) =>
		lix.db
			.selectFrom("conversation_message")
			.where("conversation_id", "=", activeConversationId)
			.selectAll()
			.orderBy("lixcol_created_at", "asc")
			.orderBy("id", "asc"),
	);

	const openProposals = useQuery(({ lix }) =>
		(lix.db.selectFrom("change_proposal") as any)
			.where("status", "=", "open")
			.selectAll(),
	);

	const [agent, setAgent] = useState<LixAgent | null>(null);

	useEffect(() => {
		let cancelled = false;
		if (!hasKey || !model) {
			setAgent(null);
			return;
		}
		setAgent(null);
		createLixAgent({ lix, model, systemPrompt })
			.then((createdAgent) => {
				if (cancelled) return;
				setAgent(createdAgent);
			})
			.catch((error_) => {
				if (cancelled) return;
				setAgent(null);
				const message =
					error_ instanceof Error
						? error_.message
						: String(error_ ?? "unknown");
				setError(`Error: ${message}`);
			});
		return () => {
			cancelled = true;
		};
	}, [hasKey, lix, model, storedApiKey]);

	const acceptPendingProposal = useCallback(async () => {
		if (!pendingProposal) return;
		const { proposalId } = pendingProposal;
		try {
			await pendingProposal.accept();
			resolvedProposalIdsRef.current.add(proposalId);
			clearPendingProposal();
		} catch (error_) {
			const message =
				error_ instanceof Error ? error_.message : String(error_ ?? "unknown");
			setError(`Error: ${message}`);
		}
	}, [pendingProposal, clearPendingProposal]);

	const rejectPendingProposal = useCallback(async () => {
		if (!pendingProposal) return;
		const { proposalId } = pendingProposal;
		const shouldSuppressError = pending;
		if (shouldSuppressError) {
			suppressedProposalErrorRef.current = proposalId;
		}
		try {
			await pendingProposal.reject();
			resolvedProposalIdsRef.current.add(proposalId);
			clearPendingProposal();
		} catch (error_) {
			if (shouldSuppressError) {
				suppressedProposalErrorRef.current = null;
			}
			const message =
				error_ instanceof Error ? error_.message : String(error_ ?? "unknown");
			setError(`Error: ${message}`);
		}
	}, [pendingProposal, clearPendingProposal, pending]);

	const clear = useCallback(async () => {
		if (!agent) throw new Error("Agent not ready");
		await runClearConversation({ agent, conversationId: activeConversationId });
		clearPendingProposal();
		setPendingMessage(null);
	}, [agent, clearPendingProposal, activeConversationId]);

	const handleModelChange = useCallback(
		(next: string) => {
			void setStoredModel(next);
		},
		[setStoredModel],
	);

	const fileRows = useQuery(({ lix }) => selectFilePaths({ lix, limit: 50 }));
	const filePaths = useMemo(
		() => (fileRows ?? []).map((row: any) => String(row.path)),
		[fileRows],
	);

	// const hasConversations = agentMessages.length > 0;
	// const conversationLabel = hasConversations
	// 	? "Current conversation"
	// 	: "New conversation";

	const [pendingMessage, setPendingMessage] =
		useState<AgentConversationMessage | null>(null);
	const launchPropsRef = useRef<string | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const messageCount = messages?.length ?? 0;

	const scrollToBottom = useCallback(() => {
		const node = scrollContainerRef.current;
		if (!node) return;
		node.scrollTop = node.scrollHeight;
	}, []);

	useEffect(() => {
		const frame = requestAnimationFrame(scrollToBottom);
		return () => cancelAnimationFrame(frame);
	}, [
		scrollToBottom,
		messageCount,
		pendingMessage,
		pendingProposal?.proposalId,
		pending,
		notice,
		error,
	]);

	const handleApiKeyChange = useCallback((value: string) => {
		setApiKeyDraft(value);
	}, []);

	const handleSaveApiKey = useCallback(() => {
		if (devApiKey) {
			return;
		}
		const trimmed = apiKeyDraft.trim();
		if (typeof window !== "undefined") {
			if (trimmed) {
				window.localStorage.setItem(OPENROUTER_KEY_STORAGE_KEY, trimmed);
			} else {
				window.localStorage.removeItem(OPENROUTER_KEY_STORAGE_KEY);
			}
		}
		setStoredApiKey(trimmed || null);
		setApiKeyDraft(trimmed);
		setNotice(null);
		setError(null);
	}, [apiKeyDraft, devApiKey]);

	const handleAcceptDecision = useCallback(
		async (id: string) => {
			if (!pendingProposal || pendingProposal.proposalId !== id) return;
			const details = pendingProposal.details;
			await acceptPendingProposal();

			// After accepting, open the file in center view
			if (context && details?.fileId) {
				context.openView?.({
					panel: "central",
					kind: FILE_VIEW_KIND,
					instance: fileViewInstance(details.fileId),
					state: buildFileViewProps({
						fileId: details.fileId,
						filePath: details.filePath,
					}),
					focus: true,
				});
			}
		},
		[pendingProposal, acceptPendingProposal, context],
	);

	const handleAcceptAlwaysDecision = useCallback(
		(id: string) => {
			if (!pendingProposal || pendingProposal.proposalId !== id) return;
			void (async () => {
				await acceptPendingProposal();
				await handleAutoAcceptToggle(true);
			})();
		},
		[pendingProposal, acceptPendingProposal, handleAutoAcceptToggle],
	);

	const handleRejectDecision = useCallback(
		(id: string) => {
			if (!pendingProposal || pendingProposal.proposalId !== id) return;
			rejectPendingProposal();
		},
		[pendingProposal, rejectPendingProposal],
	);

	const send = useCallback(
		async (
			text: string,
			opts?: {
				signal?: AbortSignal;
				onToolEvent?: (event: Extract<AgentEvent, { type: "tool" }>) => void;
			},
		) => {
			if (!agent) throw new Error("Agent not ready");
			// Use import-specific conversation if available, otherwise ensure global one
			const activeConversationId =
				importConversationId ?? (await ensureConversationId());
			const trimmed = text.trim();
			if (!trimmed) return;
			setError(null);
			clearPendingProposal();
			suppressedProposalErrorRef.current = null;
			setPending(true);
			try {
				console.log("[agent] send", {
					conversationId: activeConversationId,
					proposalMode: !autoAcceptEnabled,
				});
				const turn = sendMessage({
					agent,
					prompt: fromPlainText(trimmed),
					conversationId: activeConversationId,
					signal: opts?.signal,
					proposalMode: !autoAcceptEnabled,
				});
				const updatePending = () => {
					setPendingMessage(structuredClone(turn.message));
				};
				updatePending();
				let finalMessage: AgentConversationMessage | null = null;
				let errorEvent: Extract<AgentEvent, { type: "error" }> | null = null;
				let _activeProposal: {
					id: string;
					summary?: string;
					details?: ChangeProposalSummary | null;
				} | null = null;
				const handledToolPhases = new Map<
					string,
					Extract<AgentEvent, { type: "tool" }>["phase"]
				>();
				for await (const event of turn) {
					switch (event.type) {
						case "text":
							updatePending();
							break;
						case "thinking":
							updatePending();
							break;
						case "tool": {
							const { call, phase } = event;
							const name = call.tool_name;
							if (name && handledToolPhases.get(call.id) !== phase) {
								handledToolPhases.set(call.id, phase);
								opts?.onToolEvent?.(event);
							}
							updatePending();
							break;
						}
						case "step":
							updatePending();
							break;
						case "proposal:open": {
							if (autoAcceptEnabled) {
								break;
							}
							const details = agent
								? getChangeProposalSummary(agent, event.proposal.id)
								: null;
							const diffInstance = details?.fileId
								? diffViewInstance(details.fileId)
								: undefined;
							_activeProposal = {
								id: event.proposal.id,
								summary: event.proposal.summary,
								details,
							};
							setPendingProposal({
								proposalId: event.proposal.id,
								summary: event.proposal.summary,
								details,
								diffInstance,
								accept: event.accept,
								reject: event.reject,
							});

							// On first proposal, move agent to right panel and set it up
							if (isFirstProposalRef.current && context) {
								isFirstProposalRef.current = false;

								// Move agent view to right panel
								context.moveViewToPanel?.("right", instance?.instance);

								// Resize right panel to at least 30
								context.resizePanel?.("right", 30);

								// Focus right panel
								context.focusPanel?.("right");
							}

							if (
								context &&
								details?.fileId &&
								details.filePath &&
								diffInstance
							) {
								console.log("Proposal event", event);
								const diffConfig = createProposalDiffConfig({
									fileId: details.fileId,
									filePath: details.filePath,
									sourceVersionId: details.source_version_id,
									targetVersionId: details.target_version_id,
								});
								context.openView?.({
									panel: "central",
									kind: DIFF_VIEW_KIND,
									instance: diffInstance,
									state: buildDiffViewProps({
										fileId: details.fileId,
										filePath: details.filePath,
										diffConfig,
									}),
									focus: true,
								});
							}
							break;
						}
						case "proposal:closed": {
							if (!autoAcceptEnabled) {
								clearPendingProposal();
								_activeProposal = null;
							}
							break;
						}
						case "message":
							finalMessage = event.message;
							updatePending();
							break;
						case "error":
							errorEvent = event;
							break;
						default:
							break;
					}
				}

				if (errorEvent) {
					const err =
						errorEvent.error instanceof Error
							? errorEvent.error
							: new Error(String(errorEvent.error ?? "Agent stream error"));
					throw err;
				}

				if (!finalMessage) {
					throw new Error("Agent did not produce a final message");
				}

				console.log("[agent] turn completed", {
					conversationId: finalMessage.conversation_id,
				});
				setPendingMessage(null);
			} catch (err) {
				setPendingMessage(null);
				const message =
					err instanceof Error ? err.message : String(err ?? "unknown");
				let shouldRethrow = true;
				if (err instanceof ChangeProposalRejectedError) {
					if (suppressedProposalErrorRef.current) {
						suppressedProposalErrorRef.current = null;
						shouldRethrow = false;
					} else {
						setError(
							"Change proposal rejected. Tell the agent what to do differently.",
						);
					}
				} else {
					setError(`Error: ${message}`);
				}
				if (shouldRethrow) {
					throw err;
				}
			} finally {
				suppressedProposalErrorRef.current = null;
				setPending(false);
			}
		},
		[
			agent,
			ensureConversationId,
			importConversationId,
			context,
			autoAcceptEnabled,
			clearPendingProposal,
			instance?.instance,
		],
	);

	useEffect(() => {
		if (!launchProps?.initialMessage || !launchProps.invocationId) return;
		if (!hasKey || !agent) return;
		if (launchPropsRef.current === launchProps.invocationId) return;
		launchPropsRef.current = launchProps.invocationId;
		void send(launchProps.initialMessage);
	}, [agent, hasKey, launchProps, send]);

	useEffect(() => {
		if (!openProposals) {
			resolvedProposalIdsRef.current.clear();
		} else {
			const openIds = new Set(
				openProposals.map((proposal: any) => String(proposal.id)),
			);
			for (const id of Array.from(resolvedProposalIdsRef.current)) {
				if (!openIds.has(id)) {
					resolvedProposalIdsRef.current.delete(id);
				}
			}
		}

		if (
			pendingProposal ||
			!agent ||
			pending ||
			!openProposals ||
			openProposals.length === 0
		)
			return;
		// Try to find a proposal for this conversation (guessing column name)
		// or fallback to the first one if there's only one (heuristic)
		const proposal = (openProposals.find(
			(p: any) =>
				p.conversation_id === activeConversationId ||
				p.lixcol_conversation_id === activeConversationId,
		) ?? openProposals[0]) as any;

		if (!proposal) return;
		const fallbackProposalId = String(proposal.id);
		if (resolvedProposalIdsRef.current.has(fallbackProposalId)) {
			return;
		}

		const details = getChangeProposalSummary(agent, proposal.id);
		const diffInstance = details?.fileId
			? diffViewInstance(details.fileId)
			: undefined;

		setPendingProposal({
			proposalId: fallbackProposalId,
			summary: "Proposed changes",
			details,
			diffInstance,
			accept: async () => {
				await acceptChangeProposal({
					lix,
					proposal: { id: proposal.id },
				});
			},
			reject: async () => {
				await rejectChangeProposal({
					lix,
					proposal: { id: proposal.id },
				});
			},
		});

		// Also open the diff view if not open and we have details
		if (context && details?.fileId && details.filePath && diffInstance) {
			const diffConfig = createProposalDiffConfig({
				fileId: details.fileId,
				filePath: details.filePath,
				sourceVersionId: details.source_version_id,
				targetVersionId: details.target_version_id,
			});
			context.openView?.({
				panel: "central",
				kind: DIFF_VIEW_KIND,
				instance: diffInstance,
				state: buildDiffViewProps({
					fileId: details.fileId,
					filePath: details.filePath,
					diffConfig,
				}),
				focus: false,
			});
		}
	}, [
		openProposals,
		pendingProposal,
		pending,
		agent,
		lix,
		context,
		activeConversationId,
	]);

	const handleSlashCommand = useCallback(
		async (raw: string) => {
			const normalized = raw.trim().toLowerCase();
			if (normalized === "clear" || normalized === "reset") {
				try {
					await clear();
					setNotice("Conversation cleared.");
				} catch (err) {
					const message =
						err instanceof Error ? err.message : String(err ?? "unknown");
					setNotice(`Failed to clear conversation: ${message}`);
				}
				return;
			}
			if (normalized === "help") {
				setNotice(
					"Commands: /clear – clear the conversation, /help – show this list.",
				);
				return;
			}
			setNotice(`Unknown command: /${normalized}`);
		},
		[clear],
	);

	return (
		<>
			{usingDevApiKey ? (
				<div className="mx-2 my-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-900 shadow-sm">
					Using development OpenRouter API key.
				</div>
			) : null}
			{/* Header with conversation picker */}
			{/*
			<header className="flex items-center justify-between border-b border-border/80 py-1">
				<button
					type="button"
					disabled={!hasConversations}
					className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-foreground transition hover:text-foreground/70 disabled:cursor-default disabled:text-muted-foreground"
				>
					<span>{conversationLabel}</span>
					<ChevronDown className="h-4 w-4" />
				</button>
				<button
					type="button"
					className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground/70"
				>
					<Plus className="h-4 w-4" />
				</button>
			</header>
			*/}

			{/* Conversation messages */}
			<div
				ref={scrollContainerRef}
				className="flex-1 min-h-0 overflow-y-auto gap-4 flex flex-col"
			>
				<div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
					{hasKey ? (
						<>
							{messages?.map((message) => (
								<ConversationMessage key={message.id} message={message} />
							))}
							{pendingMessage && !isMessageEmpty(pendingMessage) ? (
								<ConversationMessage
									key={pendingMessage.id || "agent-pending"}
									message={pendingMessage}
								/>
							) : pending ? (
								<div className="px-3 py-1 text-xs text-muted-foreground">
									Thinking…
								</div>
							) : null}
							{notice ? (
								<div className="px-3 py-1 text-xs text-muted-foreground">
									{notice}
								</div>
							) : null}
							{error ? (
								<div className="px-3 py-1 text-xs text-rose-500">{error}</div>
							) : null}
						</>
					) : keyLoaded ? (
						<WelcomeScreen
							value={apiKeyDraft}
							onValueChange={handleApiKeyChange}
							onSave={handleSaveApiKey}
						/>
					) : null}
				</div>
			</div>

			{hasKey && (
				<div className="sticky bottom-0 flex justify-center px-2 pb-4 pt-4">
					{pendingProposal ? (
						<ChangeDecisionOverlay
							id={pendingProposal.proposalId}
							onAccept={handleAcceptDecision}
							onAcceptAlways={handleAcceptAlwaysDecision}
							onReject={handleRejectDecision}
						/>
					) : (
						<PromptComposer
							hasKey={hasKey}
							models={AVAILABLE_MODELS}
							modelId={selectedModelId}
							onModelChange={handleModelChange}
							autoAcceptEnabled={autoAcceptEnabled}
							onAutoAcceptToggle={handleAutoAcceptToggle}
							commands={COMMANDS}
							files={filePaths}
							pending={pending}
							onNotice={setNotice}
							onSlashCommand={handleSlashCommand}
							onSendMessage={async (message) => {
								await send(message);
							}}
						/>
					)}
				</div>
			)}
		</>
	);
}

/**
 * Agent panel view definition used by the registry.
 *
 * @example
 * import { view as agentView } from "@/views/agent-view";
 */
export const view = createReactViewDefinition({
	kind: AGENT_VIEW_KIND,
	label: "AI Agent",
	description: "Chat with the project assistant.",
	icon: Bot,
	component: ({ context, instance }) => (
		<LixProvider lix={context.lix}>
			<Suspense
				fallback={
					<div className="p-4 text-sm text-muted-foreground">
						Loading agent...
					</div>
				}
			>
				<AgentView context={context} instance={instance} />
			</Suspense>
		</LixProvider>
	),
});

export default AgentView;

function createProposalDiffConfig(args: {
	fileId: string;
	filePath: string;
	sourceVersionId: string;
	targetVersionId: string;
}): DiffViewConfig {
	const title = proposalDiffTitle(args.filePath);
	return {
		title,
		query: ({ lix }) =>
			selectVersionDiff({
				lix,
				source: { id: args.sourceVersionId },
				target: { id: args.targetVersionId },
			})
				.where("diff.file_id", "=", args.fileId)
				.orderBy("diff.entity_id")
				.leftJoin("change as after", "after.id", "diff.after_change_id")
				.leftJoin("change as before", "before.id", "diff.before_change_id")
				.select((eb) => [
					eb.ref("diff.entity_id").as("entity_id"),
					eb.ref("diff.schema_key").as("schema_key"),
					eb.ref("diff.status").as("status"),
					eb.ref("before.snapshot_content").as("before_snapshot_content"),
					eb.ref("after.snapshot_content").as("after_snapshot_content"),
					eb.fn
						.coalesce(
							eb.ref("after.plugin_key"),
							eb.ref("before.plugin_key"),
							eb.val("lix_sdk"),
						)
						.as("plugin_key"),
				])
				.$castTo<RenderableDiff>(),
	};
}

function proposalDiffTitle(filePath: string): string {
	try {
		const decoded = decodeURIComponent(filePath);
		const trimmed = decoded.startsWith("/") ? decoded.slice(1) : decoded;
		return trimmed.length > 0 ? `Proposal: ${trimmed}` : "Proposal Diff";
	} catch {
		const trimmed = filePath.startsWith("/") ? filePath.slice(1) : filePath;
		return trimmed.length > 0 ? `Proposal: ${trimmed}` : "Proposal Diff";
	}
}

function isMessageEmpty(message: AgentConversationMessage): boolean {
	const metadata = message.lixcol_metadata as any;
	const hasSteps =
		Array.isArray(metadata?.lix_agent_sdk_steps) &&
		metadata.lix_agent_sdk_steps.length > 0;
	if (hasSteps) return false;

	if (!message.body) return true;
	const text = toPlainText(message.body as any);
	return !text.trim();
}
