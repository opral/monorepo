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
		fixes: [],
		locale: props.locale || "en",
		level: props.level || "error",
		body: props.body || "mock lint report body",
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
		fixes: [
			{
				title: "Ignore",
			},
		],
		locale: props.locale || "en",
		level: props.level || "error",
		body: props.body || "mock lint report body",
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
		fixes: [
			{
				title: "Mock fix variant",
			},
			{
				title: "Ignore",
			},
		],
		locale: props.locale || "en",
		level: props.level || "error",
		body: props.body || "mock lint report body",
	}
}
