// import { pluralize } from '../src/pluralize'
// import type { PluralRules, Locale } from '../src/types'

// const text = 'You have {num} todos.'

// const definedPlurals: PluralRules = {
//     zero: 'You have no todos.',
//     one: 'You have one todo.',
//     two: 'You have two todos',
// }
// test('Zero should be zero for any language workaround', () => {
//     const locale: Locale = 'en'
//     const result = pluralize({
//         text: text,
//         num: 0,
//         locale: locale,
//         definedPlurals: definedPlurals,
//     })
//     expect(result).toEqual(definedPlurals.zero)
// })

// test('One', () => {
//     const locale: Locale = 'en'
//     const result = pluralize({
//         text: text,
//         num: 1,
//         locale: locale,
//         definedPlurals: definedPlurals,
//     })
//     expect(result).toEqual(definedPlurals.one)
// })

// test('Two locale="en"', () => {
//     const locale: Locale = 'en'
//     const result = pluralize({
//         text: text,
//         num: 2,
//         locale: locale,
//         definedPlurals: definedPlurals,
//     })
//     // en does not have "two" rule for example
//     if (new Intl.PluralRules(locale).select(2) === 'two') {
//         expect(result).toEqual(definedPlurals.two)
//     } else {
//         expect(result).toEqual(text)
//     }
// })

// test('Two locale="ar"', () => {
//     const locale: Locale = 'ar'
//     const result = pluralize({
//         text: text,
//         num: 2,
//         locale: locale,
//         definedPlurals: definedPlurals,
//     })
//     // en does not have "two" rule for example
//     if (new Intl.PluralRules(locale).select(2) === 'two') {
//         expect(result).toEqual(definedPlurals.two)
//     } else {
//         expect(result).toEqual(text)
//     }
// })
