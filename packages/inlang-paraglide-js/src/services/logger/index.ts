/* eslint-disable no-console */
import { colors } from "consola/utils";
import consola from "consola";

consola.options = {
	...consola.options,
	formatOptions: { date: false },
};

export type LoggerOptions = {
	silent: boolean;

	/**
	 * If the [paraglide] prefix should be printed before each log message.
	 */
	prefix: boolean;
};

export class Logger {
	constructor(
		private options: LoggerOptions = { silent: false, prefix: true }
	) {}

	/**
	 * Prints an empty line to the console.
	 */
	public ln(): Logger {
		if (this.options.silent) return this;
		console.log("");
		return this;
	}

	public log(message: string): Logger {
		if (this.options.silent) return this;
		const prefix = this.options.prefix ? colors.bold("[paraglide] ") : "";
		consola.log(prefix + message);
		return this;
	}

	public info(message: string): Logger {
		if (this.options.silent) return this;
		const prefix = this.options.prefix
			? colors.bold(colors.blue("[paraglide] "))
			: "";
		consola.info(prefix + message);
		return this;
	}

	public success(message: string): Logger {
		if (this.options.silent) return this;
		const prefix = this.options.prefix
			? colors.bold(colors.green("[paraglide] "))
			: "";
		consola.success(prefix + message);
		return this;
	}

	public warn(message: any, ...args: any[]): Logger {
		consola.warn(message, ...args);
		return this;
	}

	public error(message: any, ...args: any[]): Logger {
		consola.error(message, ...args);
		return this;
	}

	public box(message: any, ...args: any[]): Logger {
		if (this.options.silent) return this;
		consola.box(message, ...args);
		return this;
	}
}
