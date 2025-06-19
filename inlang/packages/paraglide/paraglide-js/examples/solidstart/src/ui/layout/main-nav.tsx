import { A } from "@solidjs/router"
import { type Component, For } from "solid-js"

import { localizeHref } from "~/paraglide/runtime"

const MainNav: Component = () => {
  return (
    <nav>
        <A href={localizeHref("/")}>Home</A>
        <A href={localizeHref("/about")}>About</A>
    </nav>
  )
}

export default MainNav