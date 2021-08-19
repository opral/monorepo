import { MissingVariableError, UnknownVariableError } from '../src/errors'
import { InlangTextApi } from '../src/inlangTextApi'
import { Locale, PluralRules } from '../src/types'

describe('.interpolate()', () => {
    test('Interpolate one variable', () => {
        const result = new InlangTextApi('Hello {user}', { locale: 'en' })
            .interpolate({ user: 'Samuel' })
            .toString()
        expect(result).toEqual('Hello Samuel')
    })

    test('Interpolate one variable which is a number', () => {
        const result = new InlangTextApi('You have {num} todos', {
            locale: 'en',
        })
            .interpolate({ num: 2 })
            .toString()
        expect(result).toEqual('You have 2 todos')
    })

    test('Interpolate multiple variables', () => {
        const result = new InlangTextApi(
            'Hello {user}, today is {day} the {date}.',
            { locale: 'en' }
        )
            .interpolate({
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
            new InlangTextApi('Hello {user}', { locale: 'en' }).interpolate({})
        ).toThrowError(MissingVariableError)
    })

    test('Throw an error if too many variables exist.', () => {
        expect(() =>
            new InlangTextApi('Hello {user}', { locale: 'en' }).interpolate({
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
            .plural(0, definedPlurals)
            .toString()
        expect(result).toEqual(definedPlurals.zero)
    })

    test('One', () => {
        const locale: Locale = 'en'
        const result = new InlangTextApi(text, { locale: locale })
            .plural(1, definedPlurals)
            .toString()
        expect(result).toEqual(definedPlurals.one)
    })

    test('Two locale="en"', () => {
        const locale: Locale = 'en'
        const result = new InlangTextApi(text, { locale: locale })
            .plural(2, definedPlurals)
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
            .plural(2, definedPlurals)
            .toString()
        // en does not have "two" rule for example
        if (new Intl.PluralRules(locale).select(2) === 'two') {
            expect(result).toEqual(definedPlurals.two)
        } else {
            expect(result).toEqual(text)
        }
    })
})
