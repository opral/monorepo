import { logBook } from "./log-book"
import "./style.css"
import { useCases } from "./use-cases"
import { lixCover, lixCoverMobile } from "./lixCover"

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="w-full max-w-screen-[700px] px-4 mx-auto">
    
    <h1 class="w-full md:w-[55%] mt-12 mb-8 text-3xl leading-[1.3] text-slate-950 font-medium">
        <svg width="40" height="auto" viewBox="0 0 189 129" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M107.415 40L123.438 70.5114L163.858 0H188.688L139.404 83.6364L165.369 127.273H140.654L123.438 97.1023L106.506 127.273H81.5059L107.415 83.6364L82.4149 40H107.415Z" fill="#07B6D4" />
            <path d="M43.5938 127.273V40H67.7983V127.273H43.5938Z" fill="#07B6D4" />
            <path d="M24 0.261719V128.262H0V0.261719H24Z" fill="#07B6D4" />
            <path d="M44 0.261719H108V20.2617H44V0.261719Z" fill="#07B6D4" />
        </svg>
        <br>
        The first of it's kind change control system.
    </h1>
    <p class="text-slate-600 leading-[1.7]">
        Lix provides <b class="text-slate-950 font-semibold">traceability of changes</b> for files stored in lix.
    </p>
    <p class="text-slate-600 leading-[1.7] mb-8">
        The lix change control system allows storing, tracking, querying, and reviewing changes in different file formats, e.g., .xlsx, .sqlite, or .inlang. 
    </p>
    <div class="w-full hidden sm:block">${lixCover}</div>
    <div class="w-full block sm:hidden">${lixCoverMobile}</div>
    <h2 class="mt-12 mb-4 text-xl font-medium text-slate-950">Use cases</h2>
    <p class="text-slate-600 leading-[1.7]">
        We collected a ranch of case studies and small excurses into different use cases of Lix.
    </p>
    <ul class="leading-[2] pl-6 mb-8">
        ${useCases
					.map(
						(useCase) => `
            <li>
                <a class="text-slate-950 underline decoration-slate-300 font-medium hover:decoration-slate-950" href="${useCase.link}">${useCase.title} <span class="font-mono text-slate-600 font-normal">${useCase.year}<span></a>
            </li>
        `
					)
					.join("")}
    </ul>

    <h2 class="mt-12 mb-4 text-xl font-medium text-slate-950">Company logbook</h2>
    <p class="text-slate-600 leading-[1.7]">
        In this thread you can follow the latest Lix updates.
    </p>
    <ul class="leading-[2] pl-6 mb-8">
        ${logBook
					.map(
						(entry) => `
            <li>
                <a class="text-slate-950 underline decoration-slate-300 font-medium hover:decoration-slate-950" href="${entry.link}">${entry.title}</a>
            </li>
        `
					)
					.join("")}
    </ul>

    <div class="border border-slate-200 rounded-lg p-7 my-16">
        <h2 class="mt-0 mb-4 text-xl font-medium text-slate-950">Lix SDK</h2>
        <p class="text-slate-600 leading-[1.7]">
            The Lix SDK allows you to build web apps with built-in change control.
        </p>
        <div class="mt-6 w-full text-center text-[16px] px-3 py-3 text-slate-700 font-medium rounded-lg bg-slate-100 hover:bg-slate-200 border-none cursor-none pointer-events-none">Lix SDK<span class="bg-slate-300 rounded px-2 py-1 ml-3">Comming soon</span></div>
    </div>
  </div>
`
