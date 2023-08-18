import Question from "~icons/material-symbols/help-outline"

/**
 * Get Help component for the footer.
 */
export function GetHelp({ text }: { text: string }) {
	return (
		<a
			class="flex items-center gap-2 justify-center text-sm hover:text-info/100 transition-colors duration-150"
			href="https://discord.gg/gdMPPWy57R"
			target="_blank"
		>
			<Question />
			<p>{text}</p>
		</a>
	)
}
