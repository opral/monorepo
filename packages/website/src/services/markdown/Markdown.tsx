import type * as Markdoc from "@markdoc/markdoc";
import { renderToElement } from "./renderToElement.js";
import { components } from "./config.js";

export function Markdown(props: {
	renderableTree: Markdoc.RenderableTreeNode;
}) {
	return <>{renderToElement(props.renderableTree, { components })} </>;
}
