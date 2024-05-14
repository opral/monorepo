export type Type =
	| AnyNumber
	| PositiveInteger
	| CurrencyCode
	| TimeZoneId
	| Anything
	| AnythingNotEmpty
	| ISO8601
	| XMLDate
	| XMLTime

export type AnyNumber = {
	type: "anyNumber"
}

export const AnyNumber = (): AnyNumber => ({ type: "anyNumber" })

export type PositiveInteger = {
	type: "positiveInteger"
}

export const Integer = (): PositiveInteger => ({ type: "positiveInteger" })

export type CurrencyCode = {
	type: "currencyCode"
}

export const CurrencyCode = (): CurrencyCode => ({ type: "currencyCode" })

export type TimeZoneId = {
	type: "timeZoneId"
}

export const TimeZoneId = (): TimeZoneId => ({ type: "timeZoneId" })

/**
 * Any (string) value
 */
export type Anything = {
	type: "anything"
}

export const Anything = (): Anything => ({ type: "anything" })

export type AnythingNotEmpty = {
	type: "anythingNotEmpty"
}

export const AnythingNotEmpty = (): AnythingNotEmpty => ({ type: "anythingNotEmpty" })

export type ISO8601 = {
	type: "iso8601"
}

export const ISO8601 = (): ISO8601 => ({ type: "iso8601" })

export type XMLDate = {
	type: "xmlDate"
}

export const XMLDate = (): XMLDate => ({ type: "xmlDate" })

export type XMLTime = {
	type: "xmlTime"
}

export const XMLTime = (): XMLTime => ({ type: "xmlTime" })
