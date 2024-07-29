import { Link } from "@/lib/i18n"
import * as m from "@/paraglide/messages.js"
import NextLink from "next/link"

export default function Home() {
	return (
		<>
			<NextLink href="/about">About</NextLink>
			<Link href="/asdf">About</Link>
			<h1>{m.paraglide_and_next_app_router()}</h1>
			<p>{m.this_app_was_localised_with_paraglide()}</p>
			<p>{m.switch_languages_in_top_right()}</p>
			<p>{m.learn_more_at_following_links()}</p>
			<ul style={{ color: "blue" }}>
				<li>
					<a href="https://inlang.com/m/osslbuzt/paraglide-next-i18n">
						{m.paraglide_documentation()}
					</a>
				</li>
				<li>
					<a href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-next/examples/app">
						{m.source_code()}
					</a>
				</li>
			</ul>
		</>
	)
}
