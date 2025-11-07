import { useCallback, type JSX } from "react";
import { ArrowRight, Zap } from "lucide-react";

type WelcomeScreenProps = {
	readonly onCreateNewFile?: () => void | Promise<void>;
};

/**
 * Minimal welcome screen that introduces Flashtype and nudges first actions.
 *
 * @example
 * return <WelcomeScreen onCreateNewFile={() => console.log("create")} />;
 */
export function WelcomeScreen({
	onCreateNewFile,
}: WelcomeScreenProps): JSX.Element {
	const handleCreateNewFile = useCallback(() => {
		if (!onCreateNewFile) return;
		void onCreateNewFile();
	}, [onCreateNewFile]);

	return (
		<div
			className="flex h-full flex-col items-center justify-center px-6 text-neutral-900"
			data-testid="welcome-screen"
		>
			<main className="flex flex-col items-center gap-6 text-center">
				{/* Logo/Brand */}
				<div className="flex items-center gap-2 text-xl">
					<Zap className="h-5 w-5 text-brand-600" />
					<span className="font-semibold text-neutral-900">flashtype.ai</span>
				</div>

				{/* Description */}
				<div className="flex flex-col items-center gap-1">
					<p className="text-base text-neutral-600">
						A Claude Code-style WYSIWYG markdown editor in the browser.
					</p>
					<p className="text-base text-neutral-600">
						Zero install. AI-powered. Built on top of
						<a href="https://lix.dev" target="_blank" rel="noreferrer">
							<svg
								width="17"
								height="12"
								viewBox="0 0 105 72"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className="inline -translate-y-1/7 ml-1.5"
							>
								<path
									d="M59.8478 22.6263L68.7495 39.5774L91.2057 0.403687H105L77.6196 46.8692L92.0454 71.1121H78.314L68.7495 54.3504L59.3428 71.1121H45.4536L59.8478 46.8692L45.9587 22.6263H59.8478Z"
									fill="#07B6D4"
								/>
								<path
									d="M24.3909 71.1119V22.6262H37.8381V71.1119H24.3909Z"
									fill="#07B6D4"
								/>
								<path
									d="M13.5052 0.549194V71.6616H0.171631V0.549194H13.5052Z"
									fill="#07B6D4"
								/>
								<path
									d="M24.6166 0.549194H60.1728V11.6605H24.6166V0.549194Z"
									fill="#07B6D4"
								/>
							</svg>
						</a>
						.
					</p>
				</div>

				{/* CTAs */}
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleCreateNewFile}
						className="cursor-pointer rounded-lg border border-neutral-200 bg-neutral-0 px-3.5 py-2 shadow-sm transition hover:border-brand-600 hover:shadow focus-visible:!bg-brand-200 focus-visible:!outline-none"
					>
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium leading-none text-neutral-900">
								Create a new file
							</span>
							<span className="flex items-center gap-1">
								<kbd className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-xs font-medium text-neutral-600">
									⌘
								</kbd>
								<kbd className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-xs font-medium text-neutral-600">
									.
								</kbd>
							</span>
						</div>
					</button>

					<a
						href="https://lix.dev"
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-brand-600"
					>
						Explore{" "}
						<svg
							width="16"
							height="12"
							viewBox="0 0 105 72"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="inline"
						>
							<path
								d="M59.8478 22.6263L68.7495 39.5774L91.2057 0.403687H105L77.6196 46.8692L92.0454 71.1121H78.314L68.7495 54.3504L59.3428 71.1121H45.4536L59.8478 46.8692L45.9587 22.6263H59.8478Z"
								fill="currentColor"
							/>
							<path
								d="M24.3909 71.1119V22.6262H37.8381V71.1119H24.3909Z"
								fill="currentColor"
							/>
							<path
								d="M13.5052 0.549194V71.6616H0.171631V0.549194H13.5052Z"
								fill="currentColor"
							/>
							<path
								d="M24.6166 0.549194H60.1728V11.6605H24.6166V0.549194Z"
								fill="currentColor"
							/>
						</svg>
						<ArrowRight className="h-3.5 w-3.5" />
					</a>
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
