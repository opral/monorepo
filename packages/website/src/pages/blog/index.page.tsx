import { Title, Meta } from "@solidjs/meta"
import { For } from "solid-js"
import { Layout } from "../Layout.jsx"
import type { PageProps } from "./@id/index.page.jsx"
import { defaultLanguage } from "@src/renderer/_default.page.route.js"
import { useI18n } from "@solid-primitives/i18n"

export function Page(props: PageProps) {
	const [, { locale }] = useI18n()

	const getLocale = () => {
		const language = locale() || defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}

	return (
		<>
			<Title>inlang Blog - Developer-first localization infrastructure.</Title>
			<Meta
				name="description"
				content="Posts that revolve around inlang, git, and localization (i18n)."
			/>
			<Layout>
				<div class="flex-row min-h-full w-full items-center justify-center mx-auto md:max-w-2xl divide-y divide-solid divide-outline">
					<For each={Object.entries(props.processedTableOfContents ?? {})}>
						{([href, frontmatter]) => (
							<div class="py-12">
								<a href={getLocale() + href} class="text-ellipsis space-y-4">
									<h2 class="text-xl font-bold tracking-tight text-on-backround truncate">
										{frontmatter.title}
									</h2>
									<p>{frontmatter.description}</p>
									{/* <img
									class="object-contain w-full rounded"
									src={section.previewImageSrc}
								/> */}
									{/* using link-primary and text-primary to render the link color by default in primary 
							but also get hover effects from link-primary */}
									<p class="link text-primary link-primary">Read more…</p>
								</a>
							</div>
						)}
					</For>
				</div>
			</Layout>
		</>
	)
}
