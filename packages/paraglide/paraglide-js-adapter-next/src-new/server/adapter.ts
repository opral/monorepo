import { CreateI18nOptions, I18n } from "../shared/api"
import { Paraglide } from "../shared/paraglide"

export const createI18n = <T extends string>(
	runtime: Paraglide<T>,
	options?: CreateI18nOptions<T>
): I18n<T> => {
	return {
		_env: "server",
		config: {
			runtime,
		},
		ClientProvider: () => null,
		ServerProvider: () => null,
		middleware: (request, response) => {
			throw new Error("Unreachable")
		},
	}
}
