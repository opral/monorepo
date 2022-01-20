import { Command } from "@oclif/core";

export default class Download extends Command {
  static description = "Say hello world";

  static examples = [
    `$ oex hello world
hello world! (./src/commands/hello/world.ts)
`,
  ];

  static flags = {};

  static args = [];

  async run(): Promise<void> {
    this.log("downloading..... (./src/commands/hello/world.ts)");
  }
}
