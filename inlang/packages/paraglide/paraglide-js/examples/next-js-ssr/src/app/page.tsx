import Link from "next/link.js";
import { m } from "../paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";

export default function Home() {
	return (
		<>
			<p>{m.example_message({ username: "Samuel" })}</p>
			<Link href={localizeHref("/subpage")}>go to subpage</Link>
		</>
	);
}
