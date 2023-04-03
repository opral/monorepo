import { SectionLayout } from "../../components/sectionLayout.jsx"
import { For } from "solid-js"

const links = [
	{
		name: "jazzband",
		img: "https://avatars.githubusercontent.com/u/15129049?s=200&v=4",
		link: "/editor/github.com/jazzband/djangorestframework-simplejwt",
	},
	{
		name: "osmosis-labs",
		img: "https://avatars.githubusercontent.com/u/79296913?s=200&v=4",
		link: "/editor/github.com/osmosis-labs/osmosis-frontend",
	},
	{
		name: "allinurl",
		img: "https://avatars.githubusercontent.com/u/5005367?v=4",
		link: "/editor/github.com/allinurl/goaccess",
	},
	{
		name: "inlang",
		img: "https://avatars.githubusercontent.com/u/91317568?s=200&v=4",
		link: "/editor/github.com/inlang/example",
	},
]

const Credibility = () => {
	return (
		<SectionLayout showLines={true} type="white">
			<div class="flex flex-col justify-center items-center py-4 gap-8">
				<div class="bg-background rounded-full h-9 px-4 flex justify-center items-center w-fit border border-surface-200 my-4 text-surface-500 text-sm">
					❤️ Loved by developers at
				</div>
				<div class="w-full flex flex-wrap">
					<For each={links}>
						{(item) => (
							<div class="w-1/2 md:w-1/4 px-10 flex justify-center items-center pb-12">
								<a
									class="flex flex-col gap-2 justify-center items-center text-surface-500 hover:text-surface-900"
									href={item.link}
								>
									<img class="w-12 h-12" src={item.img} alt={item.name + "profile picture"} />
									<p class="text-sm">{item.name}</p>
								</a>
							</div>
						)}
					</For>
				</div>
			</div>
		</SectionLayout>
	)
}

export default Credibility
