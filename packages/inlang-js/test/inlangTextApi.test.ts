import { MissingVariableError, UnknownVariableError } from '../src/errors'
import { InlangTextApi } from '../src/inlangTextApi'
import { Locale, PluralRules } from '../src/types'

function t(text: string) {
    return new InlangTextApi(text, { locale: 'en' })
}

describe('.variables()', () => {
    test('variables one variable', () => {
        const result = new InlangTextApi('Hello {user}', { locale: 'en' })
            .variables({ user: 'Samuel' })
            .toString()
        expect(result).toEqual('Hello Samuel')
    })

    test('variables one variable which is a number', () => {
        const result = new InlangTextApi('You have {num} todos', {
            locale: 'en',
        })
            .variables({ num: 2 })
            .toString()
        expect(result).toEqual('You have 2 todos')
    })

    test('variables multiple variables', () => {
        const result = new InlangTextApi(
            'Hello {user}, today is {day} the {date}.',
            { locale: 'en' }
        )
            .variables({
                user: 'Samuel',
                day: 'Tuesday',
                date: '15.Aug 2021',
            })
            .toString()
        expect(result).toEqual(
            'Hello Samuel, today is Tuesday the 15.Aug 2021.'
        )
    })

    test('Throw an error if variable does not exist.', () => {
        expect(() =>
            new InlangTextApi('Hello {user}', { locale: 'en' }).variables({})
        ).toThrowError(MissingVariableError)
    })

    test('Throw an error if too many variables exist.', () => {
        expect(() =>
            new InlangTextApi('Hello {user}', { locale: 'en' }).variables({
                user: 'Samuel',
                day: 'Tuesday',
            })
        ).toThrowError(UnknownVariableError)
    })
})

describe('.plural()', () => {
    const text = 'You have {num} todos.'

    const definedPlurals: PluralRules = {
        zero: 'You have no todos.',
        one: 'You have one todo.',
        two: 'You have two todos',
    }
    test('Zero should be zero for any language workaround', () => {
        const result = new InlangTextApi(text, { locale: 'en' })
            .plurals(0, definedPlurals)
            .toString()
        expect(result).toEqual(definedPlurals.zero)
    })

    test('One', () => {
        const locale: Locale = 'en'
        const result = new InlangTextApi(text, { locale: locale })
            .plurals(1, definedPlurals)
            .toString()
        expect(result).toEqual(definedPlurals.one)
    })

    test('Two locale="en"', () => {
        const locale: Locale = 'en'
        const result = new InlangTextApi(text, { locale: locale })
            .plurals(2, definedPlurals)
            .toString()
        // en does not have "two" rule for example
        if (new Intl.PluralRules(locale).select(2) === 'two') {
            expect(result).toEqual(definedPlurals.two)
        } else {
            expect(result).toEqual(text)
        }
    })

    test('Two locale="ar"', () => {
        const locale: Locale = 'ar'
        const result = new InlangTextApi(text, { locale: locale })
            .plurals(2, definedPlurals)
            .toString()
        // en does not have "two" rule for example
        if (new Intl.PluralRules(locale).select(2) === 'two') {
            expect(result).toEqual(definedPlurals.two)
        } else {
            expect(result).toEqual(text)
        }
    })
})

describe('pipeline', () => {
    test('.plural().variables()', () => {
        const result = t('Hello {system}, you have {num} planets.')
            .plurals(1, { one: 'Hello {system}, you have one planet.' })
            .variables({ system: 'solar system', num: 1 })
            .toString()
        expect(result).toEqual('Hello solar system, you have one planet.')
    })

    test('.variables().plural()', () => {
        const result = t('Hello {system}, you have {num} planets.')
            .variables({ system: 'solar system', num: 1 })
            .plurals(1, { one: 'Hello {system}, you have one planet.' })
            .toString()
        expect(result).toEqual('Hello solar system, you have one planet.')
    })
})
