import { ZettelDoc, ZettelNode } from "@opral/zettel-ast";
import { SerializedEditorState, SerializedLexicalNode } from "lexical";

export function fromLexicalState(state: SerializedEditorState): ZettelDoc {
  return {
    type: "zettel_doc",
    content: (state.root?.children ?? []) as unknown as ZettelNode[],
  };
}

export function toLexicalState(zettelDoc: ZettelDoc): SerializedEditorState {
  return {
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: zettelDoc.content as unknown as SerializedLexicalNode[],
    },
  };
}
