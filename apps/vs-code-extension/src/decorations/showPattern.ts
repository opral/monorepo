import * as vscode from 'vscode';
import { state } from '../state';
import peggy from 'peggy';
import { LanguageCode } from '@inlang/common';
import { serializePattern } from '@inlang/fluent-syntax';
import axios from 'axios';
import { throttle } from 'lodash';

export async function showPattern(args: { activeTextEditor: vscode.TextEditor }): Promise<unknown> {
  if (state.config.fetchUsageGrammarFrom === undefined) {
    // not showing an error message because showing the pattern is optional
    return;
  }
  if (state.config.baseLanguageCode === undefined) {
    return vscode.window.showWarningMessage(
      'The `baseLanguageCode` musst be defined in the inlang.config.json to show patterns inline.'
    );
  }
  const requestGrammar = await axios(state.config.fetchUsageGrammarFrom);
  if (requestGrammar.status !== 200) {
    return vscode.window.showWarningMessage(
      'Couldnt fetch the grammar from the provided `fetchUsageGrammarFrom` uri.'
    );
  }
  const grammar = await requestGrammar.data;
  const parser = peggy.generate(grammar);
  /**
   * Outfactor the code below to a decorations/index.ts file which handles updates
   * for all decorations? (If more were to come)
   */
  // initializing the decoration type once is extremely important.
  // vscode uses the reference to detect what decorations to redraw.
  // intializing a new decoration type in each update leads to an
  // infinite "loop" of the same decorations
  const decorationType = vscode.window.createTextEditorDecorationType({});
  updateDecorations({ parser, activeTextEditor: args.activeTextEditor, type: decorationType });
  // update the decoartions each time the file is changed
  vscode.workspace.onDidChangeTextDocument(() => {
    // only update the decorations every x milliseconds
    throttle(
      () =>
        updateDecorations({
          parser,
          activeTextEditor: args.activeTextEditor,
          type: decorationType,
        }),
      250
    );
  });
}

function updateDecorations(args: {
  activeTextEditor: vscode.TextEditor;
  parser: peggy.Parser;
  type: vscode.TextEditorDecorationType;
}): void {
  const sourceCode = args.activeTextEditor.document.getText();
  const matches = args.parser.parse(sourceCode) as {
    id: string;
    location: {
      start: { offset: number; line: number; column: number };
      end: { offset: number; line: number; column: number };
    };
  }[];
  const decorations: vscode.DecorationOptions[] = [];
  for (const match of matches) {
    // getting either the message or attribute pattern
    const messageOrAttribute = match.id.includes('.')
      ? state.resources.getAttribute({
          messageId: match.id.split('.')[0],
          id: match.id.split('.')[1],
          languageCode: state.config.baseLanguageCode as LanguageCode,
        })
      : state.resources.getMessage({
          id: match.id,
          languageCode: state.config.baseLanguageCode as LanguageCode,
        });
    // the parser starts a file from line 0, while vscode starts from line 1 -> thus -1
    const range = new vscode.Range(
      new vscode.Position(match.location.start.line - 1, match.location.start.column),
      new vscode.Position(match.location.end.line - 1, match.location.end.column)
    );
    const pattern = messageOrAttribute?.value;
    const color = pattern ? 'rgb(45 212 191/.15)' : 'rgb(244 63 94/.15)';
    const borderColor = pattern ? 'rgb(45 212 191/.50)' : 'rgb(244 63 94/.50)'; // more opacity
    const decoration: vscode.DecorationOptions = {
      range,
      renderOptions: {
        after: {
          border: `0.1rem solid ${borderColor}`,
          backgroundColor: color,
          contentText: pattern ? serializePattern(pattern) : 'ERROR: The id does not exist.',
          margin: '0.2rem',
        },
      },
    };
    decorations.push(decoration);
  }
  args.activeTextEditor.setDecorations(args.type, decorations);
}
