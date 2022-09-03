import { render as solidRender } from "solid-js/web";
import { PageContext } from "./types";

// importing tailwind classes
import "./style.css";

export const clientRouting = true;

/**
 * A function that disposes previously rendered pages.
 *
 * If the function is not executed, each route change will
 * append a page to the DOM without clearing (disposing)
 * the previous one.
 */
let disposePreviousPage: () => void;

export async function render(pageContext: PageContext) {
  const { Page } = pageContext;

  // if a page has been rendered before, dispose it.
  if (disposePreviousPage) {
    disposePreviousPage();
  }

  // render the page and save the dispose function of that page
  disposePreviousPage = solidRender(
    () => <Page clientPageContext={pageContext} />,
    document.getElementById("root")
  );
}
