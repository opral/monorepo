import Link from "#src/renderer/Link.jsx";
import Question from "~icons/material-symbols/help-outline";

/**
 * This component conveniently links to the discord server with custom text.
 */
export function GetHelp(args: { text: string }) {
	return (
		<Link
			class="flex items-center gap-2 justify-center text-sm hover:text-primary transition-colors duration-150"
			href="https://discord.gg/gdMPPWy57R"
			target="_blank"
		>
			<Question />
			<p>{args.text}</p>
		</Link>
	);
}
