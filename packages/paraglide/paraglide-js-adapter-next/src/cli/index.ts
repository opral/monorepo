import { Command } from "commander"
import { InitCommand } from "./init-command"

export const cli = new Command().version("0.0.1").addCommand(InitCommand)
