import { Inlang } from '../src/inlang'
import { Translations } from '../src/types'

const mockTranslations: Translations = {
    'About this app': 'About this app',
    'You have {num} todos': 'You have {num} todos',
    'You have {num} {color} todos': 'You have {num} {color} todos',
}

const inlang = new Inlang({
    projectDomain: 'mock',
    locale: 'en',
    projectDevelopmentLocale: 'en',
    translations: mockTranslations,
    translationsError: null,
})

test('Translation does not exist. Expect to return fallback', () => {
    const missingTranslation = 'This translations should not exist.'
    const result = inlang.translate(missingTranslation).toString()
    expect(result).toEqual(missingTranslation)
})

test('Existing translation. Expect translation', () => {
    // bad test
    const text = 'About this app'
    const result = inlang.translate(text).toString()
    expect(result).toEqual(text)
})

// test('Interpolation but variable is undefined -> throw an error ', () => {
//     expect(() => inlang.translate('You have {num} todos')).toThrow()
// })

test('Interpolation with one variable', () => {
    const result = inlang
        .translate('You have {num} todos')
        .interpolate({
            num: 2,
        })
        .toString()
    expect(result).toEqual('You have 2 todos')
})

test('Interpolation with multiple variables', () => {
    const result = inlang
        .translate('You have {num} {color} todos')
        .interpolate({ num: 2, color: 'green' })
        .toString()
    expect(result).toEqual('You have 2 green todos')
})
