import type { Component } from "solid-js"

import MainNav from "./main-nav"
import LocaleSwitch from "../locale-switch"

const MainHeader: Component = () => {
  return (
    <header>
      <div>
        <div>
          <MainNav />
          <LocaleSwitch />
        </div>
      </div>
    </header>
  )
}

export default MainHeader