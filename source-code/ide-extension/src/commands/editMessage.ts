import { query } from '@inlang/core/query'
import { setState, state } from '../state.js'
import { msg } from '../utilities/message.js'
import { EventEmitter, window } from 'vscode'
import type { Message } from '@inlang/core/ast'

const onDidEditMessageEmitter = new EventEmitter<void>()
export const onDidEditMessage = onDidEditMessageEmitter.event

export const editMessageCommand = {
  id: "inlang.editMessage",
  title: "Inlang: Edit Message",
  callback: async function ({ messageId, resource }: { messageId: string, resource: string }) {
    const { writeResources } = state().config
    const currentResource = state().resources.find((r) => r.languageTag.name === resource)
    if (!currentResource) {
      return msg("Couldn't retrieve resource", "warn", "notification")
    }

    const message = query(currentResource).get({ id: messageId })

    const newValue = await window.showInputBox({
      title: "Enter new value:",
      placeHolder: message?.pattern.elements[0]!.value as string
    })

    if (newValue === undefined) {
      return
    }

    const newMessage: Message = {
      type: "Message",
      id: { type: "Identifier", name: messageId },
      pattern: {
        type: "Pattern",
        elements: [{ type: "Text", value: newValue }],
      },
    }

    const [newResource, exception] = query(currentResource).update({ id: messageId, with: newMessage })

    if (exception) {
      return window.showErrorMessage("Couldn't update message. ", exception.message)
    }
    const resources = state().resources.map((r) =>
      r.languageTag.name === resource ? newResource : r,
    )
    await writeResources({
      config: state().config,
      resources,
    })
    setState({ ...state(), resources })

    onDidEditMessageEmitter.fire()

    return msg("Message updated.")
  }
} as const
