import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type JSX,
} from "react";
import { Zap } from "lucide-react";
import { LixProvider, useLix, useQuery } from "@lix-js/react-utils";
import { PromptComposer } from "@/views/agent-view/components/prompt-composer";
import { COMMANDS } from "@/views/agent-view/commands";
import { selectFilePaths } from "@/views/agent-view/select-file-paths";
import { VITE_DEV_OPENROUTER_API_KEY } from "@/env-variables";
import { useKeyValue } from "@/hooks/key-value/use-key-value";
import type { ViewContext } from "./types";

const DEFAULT_MODEL_ID = "z-ai/glm-4.6";
const AVAILABLE_MODELS = [
	{ id: "anthropic/claude-4.5-sonnet", label: "Claude 4.5 Sonnet" },
	{ id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
	{ id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
	{ id: "z-ai/glm-4.6", label: "GLM 4.6 by ZAI" },
	{ id: "x-ai/grok-code-fast-1", label: "Grok Code Fast 1" },
	{ id: "openai/gpt-5", label: "GPT-5" },
	{ id: "openai/gpt-5-codex", label: "GPT-5 Codex" },
] as const;
const OPENROUTER_KEY_STORAGE_KEY = "flashtype_agent_openrouter_api_key";

type WelcomeScreenProps = {
	/**
	 * View context for opening views and accessing Lix.
	 */
	readonly context: ViewContext;
	/**
	 * Callback to open the agent view.
	 */
	readonly onOpenAgentView: () => void;
};

/**
 * Welcome screen with a prompt composer to reduce onboarding friction.
 * Users can immediately start typing what they want to write.
 *
 * @example
 * return (
 *   <WelcomeScreen
 *     context={viewContext}
 *     onOpenAgentView={() => console.log("open agent")}
 *   />
 * );
 */
function WelcomeScreenContent({
	context,
	onOpenAgentView,
}: WelcomeScreenProps): JSX.Element {
	const devApiKey =
		VITE_DEV_OPENROUTER_API_KEY && VITE_DEV_OPENROUTER_API_KEY.trim().length > 0
			? VITE_DEV_OPENROUTER_API_KEY.trim()
			: null;
	const usingDevApiKey = Boolean(devApiKey);

	const [storedApiKey, setStoredApiKey] = useState<string | null>(devApiKey);
	const [keyLoaded, setKeyLoaded] = useState(usingDevApiKey);
	const [storedModel, setStoredModel] = useKeyValue("flashtype_agent_model");
	const [autoAcceptRaw, setAutoAccept] = useKeyValue(
		"flashtype_auto_accept_session",
	);
	const [notice, setNotice] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const [placeholderText, setPlaceholderText] = useState("");

	const selectedModelId = useMemo(() => {
		if (!storedModel) return DEFAULT_MODEL_ID;
		const match = AVAILABLE_MODELS.find((option) => option.id === storedModel);
		return match ? match.id : DEFAULT_MODEL_ID;
	}, [storedModel]);
	const autoAcceptEnabled = Boolean(autoAcceptRaw);
	const hasKey = Boolean(storedApiKey);

	const suggestions = useMemo(
		() => [
			"write a blog post about...",
			"review your resume",
			"draft an email",
			"write a love letter",
			"shorten your LinkedIn post",
		],
		[],
	);
	const animationRef = useRef<{
		currentIndex: number;
		charIndex: number;
		isDeleting: boolean;
		timeoutId: ReturnType<typeof setTimeout> | null;
	}>({
		currentIndex: 0,
		charIndex: 0,
		isDeleting: false,
		timeoutId: null,
	});

	useEffect(() => {
		if (!hasKey) {
			if (animationRef.current.timeoutId) {
				clearTimeout(animationRef.current.timeoutId);
				animationRef.current.timeoutId = null;
			}
			setPlaceholderText("");
			return;
		}

		const type = () => {
			const { currentIndex, charIndex, isDeleting } = animationRef.current;
			const currentSuggestion = suggestions[currentIndex];
			if (isDeleting) {
				const newCharIndex = charIndex - 1;
				animationRef.current.charIndex = newCharIndex;
				setPlaceholderText(
					`Ask Flashtype to ${currentSuggestion.slice(0, newCharIndex)}`,
				);
				if (newCharIndex === 0) {
					animationRef.current.isDeleting = false;
					animationRef.current.currentIndex =
						(currentIndex + 1) % suggestions.length;
					animationRef.current.timeoutId = setTimeout(type, 500);
				} else {
					animationRef.current.timeoutId = setTimeout(type, 50);
				}
			} else {
				const newCharIndex = charIndex + 1;
				animationRef.current.charIndex = newCharIndex;
				setPlaceholderText(
					`Ask Flashtype to ${currentSuggestion.slice(0, newCharIndex)}`,
				);
				if (newCharIndex === currentSuggestion.length) {
					animationRef.current.isDeleting = true;
					animationRef.current.timeoutId = setTimeout(type, 2000);
				} else {
					animationRef.current.timeoutId = setTimeout(type, 100);
				}
			}
		};

		animationRef.current.timeoutId = setTimeout(type, 500);

		return () => {
			if (animationRef.current.timeoutId) {
				clearTimeout(animationRef.current.timeoutId);
				animationRef.current.timeoutId = null;
			}
		};
	}, [hasKey, suggestions]);

	useEffect(() => {
		if (devApiKey) {
			setStoredApiKey(devApiKey);
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
		}
		setKeyLoaded(true);
	}, [devApiKey]);

	const fileRows = useQuery(({ lix }) => selectFilePaths({ lix, limit: 50 }));
	const filePaths = useMemo(
		() => (fileRows ?? []).map((row: any) => String(row.path)),
		[fileRows],
	);

	const handleModelChange = useCallback(
		(next: string) => {
			void setStoredModel(next);
		},
		[setStoredModel],
	);

	const handleAutoAcceptToggle = useCallback(
		async (next: boolean) => {
			await setAutoAccept(next);
			setNotice(null);
		},
		[setAutoAccept],
	);

	const handleSlashCommand = useCallback(
		async (command: string) => {
			// For welcome screen, slash commands should open agent view
			onOpenAgentView();
		},
		[onOpenAgentView],
	);

	const handleSendMessage = useCallback(
		async (message: string) => {
			// Open agent view first, then the agent view will handle sending
			onOpenAgentView();
			// Store the message to send it when agent view opens
			// This is a simple approach - in a real implementation, you might want
			// to pass the message through context or state
			if (typeof window !== "undefined") {
				sessionStorage.setItem("flashtype_pending_welcome_message", message);
			}
		},
		[onOpenAgentView],
	);

	if (!keyLoaded) {
		return (
			<div
				className="flex h-full flex-col items-center justify-center px-6 text-neutral-900"
				data-testid="welcome-screen"
			>
				<div className="text-neutral-600">Loading...</div>
			</div>
		);
	}

	return (
		<div
			className="flex h-full flex-col items-center justify-center px-6 text-neutral-900"
			data-testid="welcome-screen"
		>
			<main className="flex w-full max-w-3xl flex-col items-center gap-8">
				{/* Logo/Brand */}
				<div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm mb-16 -mt-32">
					<Zap className="h-3.5 w-3.5 text-brand-600" />
					<span className="font-semibold text-neutral-900">flashtype.ai</span>
				</div>

				{/* Main prompt */}
				<div className="flex flex-col items-center gap-2">
					<h1 className="text-4xl font-semibold text-neutral-900">
						What do you want to write?
					</h1>
					<p className="text-base text-neutral-600">
						Create markdown documents by chatting with AI
					</p>
				</div>

				{/* Prompt Composer */}
				<div className="w-full [&>div>div:last-child]:hidden">
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
						onSendMessage={handleSendMessage}
						placeholderText={placeholderText || "Ask Flashtype to..."}
					/>
				</div>

				{/* Social Links */}
				<div className="mt-4 flex items-center gap-4 text-xs text-neutral-400">
					<a
						href="https://github.com/opral/flashtype"
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1.5 transition hover:text-neutral-600"
					>
						<svg
							className="h-5 w-5"
							fill="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								fillRule="evenodd"
								d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
								clipRule="evenodd"
							/>
						</svg>
						GitHub
					</a>
					<span aria-hidden="true">·</span>
					<a
						href="https://discord.gg/StVekJpyBp"
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1.5 transition hover:text-neutral-600"
					>
						<svg
							className="h-5 w-5"
							fill="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
						</svg>
						Discord
					</a>
					<span aria-hidden="true">·</span>
					<a
						href="https://x.com/samuelstroschei"
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1.5 transition hover:text-neutral-600"
					>
						<svg
							className="h-5 w-5"
							fill="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
						</svg>
						X
					</a>
				</div>
			</main>
		</div>
	);
}

/**
 * Welcome screen wrapper that provides agent state and Lix context.
 */
export function WelcomeScreen({
	context,
	onOpenAgentView,
}: WelcomeScreenProps): JSX.Element {
	return (
		<LixProvider lix={context.lix}>
			<WelcomeScreenContent
				context={context}
				onOpenAgentView={onOpenAgentView}
			/>
		</LixProvider>
	);
}
