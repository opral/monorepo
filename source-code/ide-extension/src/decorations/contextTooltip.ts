import type { MessageReferenceMatch } from '@inlang/core/config';
import { query } from '@inlang/core/query';
import { MarkdownString, Uri } from 'vscode';
import { state } from '../state.js';

const MISSING_TRANSLATION_MESSAGE = '[missing]'

type ContextTableRow = {
  language: string;
  message: string;
  openInEditorCommand?: Uri
}

function renderTranslationRow(row: ContextTableRow) {
  const messageListing = `<td><strong>${row.language}</strong></td><td>${row.message}</td>`
  const editCommand = `<td>$(edit)</td>`
  const goToFileCommand = `<td>$(go-to-file)</td>`
  const openInEditorCommand = row.openInEditorCommand ? `<td><a href="${row.openInEditorCommand}">$(link-external)</a></td>` : ''
  return `<tr>${messageListing}${editCommand}${goToFileCommand}${openInEditorCommand}</tr>`
}

export function contextTooltip(message: MessageReferenceMatch) {
  const resources = state().resources
  const messages = resources.reduce<ContextTableRow[]>((acc, r) => {
    const m = query(r).get({ id: message.messageId })

    return [...acc, {
      language: r.languageTag.name,
      message: m?.pattern.elements[0]!.value ? m.pattern.elements[0].value as string : MISSING_TRANSLATION_MESSAGE,
      openInEditorCommand: Uri.parse(`command:inlang.openInEditor?${encodeURIComponent(JSON.stringify([{ messageId: message.messageId }]))}`)
    }]
  }, [])
  const contextTable = `<table>${messages.map((m) => renderTranslationRow(m)).join('')}</table>`
  const tooltip = new MarkdownString(contextTable)

  tooltip.supportHtml = true
  tooltip.isTrusted = true
  tooltip.supportThemeIcons = true

  return tooltip
};
