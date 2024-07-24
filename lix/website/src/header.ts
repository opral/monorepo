import "./style.css"

document.querySelector<HTMLDivElement>("#header")!.innerHTML = `
    <div class="w-full max-w-screen-[700px] px-4 mx-auto my-8 flex items-center justify-end">
        <a href="https://opral.substack.com/" target="_blanc" class="mt-2 w-fit text-[16px] px-4 py-3 text-slate-700 font-medium rounded-lg bg-slate-100 hover:bg-slate-200 border-none cursor-pointer flex items-center gap-2 no-underline">
            <svg role="img" width="24" height="24" viewBox="0 0 1000 1000" fill="#FF6719" stroke-width="1.8" stroke="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <path d="M764.166 348.371H236.319V419.402H764.166V348.371Z"></path>
                    <path d="M236.319 483.752V813.999L500.231 666.512L764.19 813.999V483.752H236.319Z"></path>
                    <path d="M764.166 213H236.319V284.019H764.166V213Z"></path>
                </g>
            </svg>
            Subscribe
        </a>
    </div>
`
