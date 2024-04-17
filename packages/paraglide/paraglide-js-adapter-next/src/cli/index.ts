import { Command } from "commander"
import { InitCommand } from "./init-command"

export const cli = new Command().version(PARAGLIDE_NEXT_VERSION).addCommand(InitCommand)
