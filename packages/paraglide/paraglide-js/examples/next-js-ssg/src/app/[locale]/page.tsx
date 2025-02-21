import Link from "next/link.js";
import { m } from "../../paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";

export default function Home() {
	return (
		<>
			<p>switching locale via routing</p>
			<Link href={localizeHref("/", { locale: "en" })}>EN</Link>
			<br />
			<Link href={localizeHref("/", { locale: "de" })}>DE</Link>
			<p>{m.example_message({ username: "Samuel" })}</p>
		</>
	);
}
