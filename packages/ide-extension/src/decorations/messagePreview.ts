import * as vscode from "vscode";
import { debounce } from "throttle-debounce";
import { state } from "../state.js";


export async function messagePreview(args: { activeTextEditor: vscode.TextEditor, context: vscode.ExtensionContext }) {
  const { context } = args;
  let { activeTextEditor } = args;

  if (state().config.referenceLanguage === undefined) {
    return vscode.window.showWarningMessage(
      "The `referenceLanguage` musst be defined in the inlang.config.js to show patterns inline."
    );
  }

  if (activeTextEditor) {
    updateDecorations();
  }

  function updateDecorations() {
    return;
  }

  const debouncedUpdateDecorations = debounce(500, updateDecorations);

  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      activeTextEditor = editor;
      debouncedUpdateDecorations();
    }
  }, undefined, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument(event => {
    if (activeTextEditor && event.document === activeTextEditor.document) {
      updateDecorations();
    }
  }, undefined, context.subscriptions);
}


async function updateDecorations2(args: {
  activeTextEditor: vscode.TextEditor;
  type: vscode.TextEditorDecorationType;
}): Promise<void> {
  const sourceCode = args.activeTextEditor.document.getText();
  console.log({ sourceCode });
  //const matches = await state().config.ideExtension.inlinePatternMatcher({
  //  text: sourceCode,
  //  $import,
  //});
  //console.log({ matches });
  // const matches = args.parser.parse(sourceCode) as {
  // 	id: string;
  // 	location: {
  // 		start: { offset: number; line: number; column: number };
  // 		end: { offset: number; line: number; column: number };
  // 	};
  // }[];
  // const decorations: vscode.DecorationOptions[] = [];
  // for (const match of matches) {
  // 	// getting either the message or attribute pattern
  // 	const messageOrAttribute = match.id.includes(".")
  // 		? state.resources.getAttribute({
  // 				messageId: match.id.split(".")[0],
  // 				id: match.id.split(".")[1],
  // 				languageCode: state.config.baseLanguageCode as LanguageCode,
  // 		  })
  // 		: state.resources.getMessage({
  // 				id: match.id,
  // 				languageCode: state.config.baseLanguageCode as LanguageCode,
  // 		  });
  // 	// the parser starts a file from line 0, while vscode starts from line 1 -> thus -1
  // const range = new vscode.Range(
  // 	new vscode.Position(
  // 		match.location.start.line - 1,
  // 		match.location.start.column
  // 	),
  // 	new vscode.Position(match.location.end.line - 1, match.location.end.column)
  // );
  // 	const pattern = messageOrAttribute?.value;
  // 	const color = pattern ? "rgb(45 212 191/.15)" : "rgb(244 63 94/.15)";
  // 	const borderColor = pattern ? "rgb(45 212 191/.50)" : "rgb(244 63 94/.50)"; // more opacity
  // 	const decoration: vscode.DecorationOptions = {
  // 		range,
  // 		renderOptions: {
  // 			after: {
  // 				border: `0.1rem solid ${borderColor}`,
  // 				backgroundColor: color,
  // 				contentText: pattern
  // 					? serializePattern(pattern)
  // 					: "ERROR: The id does not exist.",
  // 				margin: "0.2rem",
  // 			},
  // 		},
  // 	};
  // 	decorations.push(decoration);
  // }
  // args.activeTextEditor.setDecorations(args.type, decorations);
}
