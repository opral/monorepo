import { Command } from "commander"
import { editor } from "./editor.js"

export const open = new Command()
	.command("open")
	.description("Commands for open parts of the inlang ecosystem.")
	.argument("<command>")
	.addCommand(editor)
