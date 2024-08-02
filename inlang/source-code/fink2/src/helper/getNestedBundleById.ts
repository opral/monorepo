import { Database } from "@inlang/sdk2";
import { SelectQueryBuilder } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/sqlite";

const populateMessages = (
	bundleSelect: SelectQueryBuilder<Database, "bundle", object>
) => {
	return bundleSelect.select((eb) => [
		// select all columns from bundle
		"id",
		"alias",
		// select all columns from messages as "messages"
		jsonArrayFrom(
			populateVariants(eb.selectFrom("message")).whereRef(
				"message.bundleId",
				"=",
				"bundleId"
			)
		).as("messages"),
	]);
};

const populateVariants = (
	messageSelect: SelectQueryBuilder<Database, "message", object>
) => {
	return messageSelect.select((eb) => [
		// select all columns from message
		"id",
		"bundleId",
		"locale",
		"declarations",
		"selectors",
		// select all columns from variants as "variants"
		jsonArrayFrom(
			eb
				.selectFrom("variant")
				.select(["id", "messageId", "match", "pattern"])
				.whereRef("variant.messageId", "=", "message.id")
		).as("variants"),
	]);
};

export const getNestedBundleById = async (
	bundleBuider: SelectQueryBuilder<Database, "bundle", object>,
	bundleId: string
) => {
	return await populateMessages(bundleBuider)
		.where("bundle.id", "=", bundleId)
		.executeTakeFirst();
};
