/* @refresh reload */
import { render } from "solid-js/web";
// loading shoelace components
import "./shoelace.d.ts";
import "./style.css";

import { App } from "./App";

render(() => <App />, document.getElementById("root") as HTMLElement);
