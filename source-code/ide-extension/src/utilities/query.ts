import type { Message } from "@inlang/core/ast"

export function getMessageAsString(message?: Message) {
  if (!message?.pattern.elements || message.pattern.elements.length < 1) {
    return undefined;
  }

  const elementsMap = message.pattern.elements.map((e) => {
    if (e.type === 'Placeholder') {
      // TODO: Use framework specific placeholder indication
      return `{{${e.body.name}}}`
    }

    return e.value
  })
  return elementsMap.join('')
}
