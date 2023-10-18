import { IconSvelte, IconReact, IconNextjs, IconJavascript, IconFlutter } from "#src/pages/application/index.page.jsx"
import { For } from "solid-js"

const Stack = () => {
  const getSubCategies = [
    {
      name: "Svelte",
      param: "svelte",
      icon: <IconSvelte class="-ml-1 w-8 h-8" />,
    },
    {
      name: "React",
      param: "react",
      icon: <IconReact class="-ml-1 w-8 h-8" />,
    },
    {
      name: "Next.js",
      param: "nextjs",
      icon: <IconNextjs class="-ml-1 w-8 h-8" />,
    },
    {
      name: "Javascript",
      param: "javascript",
      icon: <IconJavascript class="-ml-1 w-8 h-8" />,
    },
    {
      name: "Flutter",
      param: "flutter",
      icon: <IconFlutter class="-ml-1 w-8 h-8" />,
    },
  ]
  return (
    <div class="w-full flex gap-4 mt-4 md:mt-10 mb-10 flex-col-reverse md:flex-row">
      <div class="w-full">
        <p class="pb-2 text-surface-500 text-sm">Stack</p>
        <div class="flex gap-2 overflow-x-scroll hide-scrollbar">
          <For each={getSubCategies}>
            {(link) => (
              <a
                href={
                  window.location.origin + "//" + window.location.pathname + "/?search=" + link.param
                }
                class="flex-grow"
              >
                <div
                  class={
                    (window.location.search.includes(link.param)
                      ? "bg-primary text-background "
                      : "bg-background text-surface-600 border border-surface-200 hover:border-surface-400") +
                    " px-6 py-3 flex-grow font-medium cursor-pointer rounded-lg flex items-center gap-2"
                  }
                >
                  {link.icon}
                  {link.name}
                </div>
              </a>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}

export default Stack