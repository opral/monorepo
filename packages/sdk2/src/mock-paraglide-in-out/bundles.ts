import * as en from "./messages/en.js";
import {
	validateDatetimeType,
	validateGenderType,
	type Gender,
} from "./registry.js";

const locale = "en";

export function happy_hippo_sky(inputs: {
	username: string;
	userGender: Gender;
	photoCount: number;
	time: string;
}) {
	validateGenderType(inputs.userGender);
	validateDatetimeType(inputs.time);

	if (locale === "en") return en.happy_hippo_sky(inputs);
	else throw new Error("Unsupported locale");
}
