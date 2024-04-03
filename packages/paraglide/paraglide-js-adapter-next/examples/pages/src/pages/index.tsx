import * as m from "@/paraglide/messages"
import Head from "next/head"

export default function Home() {
	return (
		<main className="container">
			<Head>
				<title>{m.paraglide_and_next_pages_router()}</title>
				<meta name="description" content={m.this_app_was_localised_with_paraglide()} />
				<link rel="icon" href="/favicon.png" />
			</Head>
			<h1>{m.paraglide_and_next_pages_router()}</h1>
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
					<a href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next/examples/pages">
						{m.source_code()}
					</a>
				</li>
			</ul>
		</main>
	)
}
