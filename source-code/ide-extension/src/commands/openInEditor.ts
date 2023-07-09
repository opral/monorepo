import { getGitOrigin } from '../services/telemetry/implementation.js'
import * as vscode from "vscode"

const EDITOR_BASE_PATH = 'https://inlang.com/editor/'

export const openInEditorCommand = {
  id: "inlang.openInEditor",
  title: "Inlang: Open in editor",
  callback: async function ({ messageId }: { messageId?: string }) {
    // TODO: Probably the origin should be configurable via the config.
    const origin = (await getGitOrigin())?.replaceAll('.git', '')
    const uri = messageId ? `${EDITOR_BASE_PATH}${origin}?id=${messageId}` : `${EDITOR_BASE_PATH}${origin}`;

    vscode.env.openExternal(vscode.Uri.parse(uri))
    return undefined
  }
} as const
