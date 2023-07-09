import type { MessageReferenceMatch } from '@inlang/core/config';
import { query } from '@inlang/core/query';
import { MarkdownString } from 'vscode';
import { state } from '../state.js';

const MISSING_TRANSLATION_MESSAGE = '[missing]'

type ContextTableRow = {
  language: string;
  message: string;
}

function renderTranslationRow(row: ContextTableRow) {
  return `<tr><td><strong>${row.language}</strong></td><td>${row.message}</td><td>$(edit)</td><td>$(go-to-file)</td><td>$(link-external)</td></tr>`
}

export function contextTooltip(message: MessageReferenceMatch) {
  const resources = state().resources
  const messages = resources.reduce<ContextTableRow[]>((acc, r) => {
    const m = query(r).get({ id: message.messageId })

    if (m?.pattern.elements[0]!.value) {
      return [...acc, { language: r.languageTag.name, message: m.pattern.elements[0].value as string }]
    } else {
      return [...acc, { language: r.languageTag.name, message: MISSING_TRANSLATION_MESSAGE }]
    }
  }, [])
  const contextTable = `<table>${messages.map((m) => renderTranslationRow(m)).join('')}</table>`
  const tooltip = new MarkdownString(contextTable)

  tooltip.supportHtml = true
  tooltip.isTrusted = true
  tooltip.supportThemeIcons = true

  return tooltip
};
