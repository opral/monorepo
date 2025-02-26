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

	public log(message: string): Logger {
		if (this.options.silent) return this;
		const prefix = this.options.prefix ? colors.bold("[paraglide-js] ") : "";
		consola.log(prefix + message);
		return this;
	}

	public info(message: string): Logger {
		if (this.options.silent) return this;
		const prefix = this.options.prefix
			? colors.bold(colors.blue("[paraglide-js] "))
			: "";
		consola.info(prefix + message);
		return this;
	}

	public success(message: string): Logger {
		if (this.options.silent) return this;
		const prefix = this.options.prefix
			? colors.bold(colors.green("[paraglide-js] "))
			: "";
		consola.success(prefix + message);
		return this;
	}

	public warn(message: any, ...args: any[]): Logger {
		const prefix = this.options.prefix
			? colors.bold(colors.yellow("[paraglide-js] "))
			: "";
		consola.warn(prefix + message, ...args);
		return this;
	}

	public error(message: any, ...args: any[]): Logger {
		const prefix = this.options.prefix
			? colors.bold(colors.red("[paraglide-js] "))
			: "";
		consola.error(prefix + message, ...args);
		return this;
	}

	public box(message: any, ...args: any[]): Logger {
		if (this.options.silent) return this;
		consola.box(message, ...args);
		return this;
	}
}
