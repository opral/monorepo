import "./style.css"

const footerLinks = [
	{
		title: "GitHub",
		link: "https://github.com/opral/monorepo/tree/main/lix",
	},
	{
		title: "Twitter",
		link: "https://x.com/lixCCS",
	},
	{
		title: "Email",
		link: "mailto:hello@opral.com",
	},
]

document.querySelector<HTMLDivElement>("#footer")!.innerHTML = `
    <div class="w-full h-[1px] bg-slate-200 my-16"></div>
    <div class="w-full max-w-screen-[700px] px-4 mx-auto my-16">
        <p class="mt-12 mb-4 text-slate-950 font-medium">© Lix by Opral</p>
        <ul class="leading-[1.7] pl-0 list-none flex gap-2">
        ${footerLinks
					.map(
						(useCase) => `
            <li>
                <a class="text-slate-600 underline decoration-slate-300 font-medium hover:decoration-slate-950" href="${useCase.link}">${useCase.title}</a>
            </li>
        `
					)
					.join("•")}
        </ul>
        <a href="https://opral.substack.com/" target="_blanc" class="mt-2 w-fit text-[16px] px-4 py-3 text-slate-700 font-medium rounded-lg bg-slate-100 hover:bg-slate-200 border-none cursor-pointer flex items-center gap-2 no-underline">
            <svg role="img" width="24" height="24" viewBox="0 0 1000 1000" fill="#FF6719" stroke-width="1.8" stroke="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <title></title>
                    <path d="M764.166 348.371H236.319V419.402H764.166V348.371Z"></path>
                    <path d="M236.319 483.752V813.999L500.231 666.512L764.19 813.999V483.752H236.319Z"></path>
                    <path d="M764.166 213H236.319V284.019H764.166V213Z"></path>
                </g>
            </svg>
            Subscribe our Substack
        </a>
    </div>
`
