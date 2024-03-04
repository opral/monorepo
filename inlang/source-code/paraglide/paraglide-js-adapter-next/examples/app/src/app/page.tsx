import * as m from "@/paraglide/messages.js"

export default function Home() {
	return (
		<>
			<h1>{m.paraglide_and_next_app_router()}</h1>
			<p>{m.this_app_was_localised_with_paraglide()}</p>
			<p>{m.switch_languages_in_top_right()}</p>
			<p>{m.learn_more_at_following_links()}</p>
			<ul style={{ color: "blue" }}>
				<li>
					<a href="https://inlang.com/m/osslbuzt/library-inlang-paraglideJsAdapterNextJs">
						{m.paraglide_documentation()}
					</a>
				</li>
				<li>
					<a href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next/examples/app">
						{m.source_code()}
					</a>
				</li>
			</ul>
		</>
	)
}
