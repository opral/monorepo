import type { LintReport } from "../../types/lint.js"

export const createMockBundleLintReport = (props: {
	ruleId?: LintReport["ruleId"]
	messageBundleId?: string
	locale?: LintReport["locale"]
	level?: LintReport["level"]
	body?: string
}): LintReport => {
	return {
		ruleId: props.ruleId || "messageBundleLintRule.namespace.exampleRule",
		messageBundleId: props.messageBundleId || "mock_bundle_human_id",
		messageId: undefined,
		variantId: undefined,
		locale: props.locale || "en",
		level: props.level || "error",
		body: props.body || "mock lint report body",
		fixes: [],
	}
}

export const createMockMessageLintReport = (props: {
	ruleId?: LintReport["ruleId"]
	messageBundleId?: string
	messageId?: string
	locale?: LintReport["locale"]
	level?: LintReport["level"]
	body?: string
}): LintReport => {
	return {
		ruleId: props.ruleId || "messageBundleLintRule.namespace.exampleRule",
		messageBundleId: props.messageBundleId || "mock_bundle_human_id",
		messageId: props.messageId || "mock_message_id",
		variantId: undefined,
		locale: props.locale || "en",
		level: props.level || "error",
		body: props.body || "mock lint report body",
		fixes: [],
	}
}

export const createMockVariantLintReport = (props: {
	ruleId?: LintReport["ruleId"]
	messageBundleId?: string
	messageId?: string
	variantId?: string
	locale?: LintReport["locale"]
	level?: LintReport["level"]
	body?: string
}): LintReport => {
	return {
		ruleId: props.ruleId || "messageBundleLintRule.namespace.exampleRule",
		messageBundleId: props.messageBundleId || "mock_bundle_human_id",
		messageId: props.messageId || "mock_message_id",
		variantId: props.variantId || "mock_variant_id",
		locale: props.locale || "en",
		level: props.level || "error",
		body: props.body || "mock lint report body",
		fixes: [],
	}
}
