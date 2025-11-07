import { useId } from "react";
import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";

type WelcomeScreenProps = {
	value: string;
	onValueChange(value: string): void;
	onSave(): void;
};

/**
 * Minimal BYOK onboarding card that matches the agent composer styling.
 *
 * @example
 * return (
 * 	<WelcomeScreen
 * 		value="sk-or-v1-..."
 * 		onValueChange={(next) => console.log(next)}
 * 		onSave={() => console.log("saved")}
 * 	/>
 * );
 */
export function WelcomeScreen({
	value,
	onValueChange,
	onSave,
}: WelcomeScreenProps) {
	const inputId = useId();
	const canSave = value.trim().length > 0;

	return (
		<div className="flex h-full w-full flex-col items-center">
			<div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
				<div className="flex items-center gap-2">
					<svg
						className="h-4 w-auto sm:h-6"
						viewBox="0 0 105 72"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
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
					<span className="text-2xl font-semibold text-foreground">Agent</span>
				</div>
			</div>
			<div className="w-full max-w-md">
				<div className="rounded-md border border-border/80 bg-background">
					<div className="flex flex-col gap-4 p-4">
						<div className="space-y-2">
							<h2 className="text-sm font-semibold leading-6 text-foreground">
								Provide OpenRouter API key
							</h2>
							<p className="text-xs text-muted-foreground">
								Warning: The API key is stored in the browser. Any JS code
								running in this context can access it. Make sure to cap the
								usage of the OpenRouter API key.
							</p>
							<a
								className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 transition hover:text-neutral-900"
								href="https://openrouter.ai/settings/keys"
								target="_blank"
								rel="noopener noreferrer"
							>
								How to get a key
								<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
							</a>
						</div>
						<label htmlFor={inputId} className="sr-only">
							OpenRouter API key
						</label>
						<Input
							id={inputId}
							value={value}
							size={0}
							onChange={(event) => onValueChange(event.target.value)}
							placeholder="sk-or-v1-…"
							autoComplete="off"
							className="text-sm"
						/>
						<div className="flex justify-end pt-1">
							<button
								type="button"
								onClick={onSave}
								disabled={!canSave}
								className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Continue
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
