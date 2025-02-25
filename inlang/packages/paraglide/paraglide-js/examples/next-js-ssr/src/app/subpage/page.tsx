import Link from "next/link.js";
import { m } from "../../paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";

export default function Home() {
	return (
		<>
			<p>{m.subpage()}</p>
			<Link href={localizeHref("/")}>go to home</Link>
		</>
	);
}
