import { Inlang } from '../src/inlang'
import type { TranslationsForLocale } from '../src/types'

const mockTranslations: TranslationsForLocale = {
    metadata: {
        projectDomain: 'test.dev',
        projectDevelopmentLocale: 'en',
        translationsLocale: 'de',
    },
    byKey: {
        'About this app': 'Über diese App',
        'You have {num} todos': 'Du hast {num} Todos',
        'You have {num} {color} todos': 'Du hast {num} {color} Todos',
        green: 'grün',
    },
}

const inlang = new Inlang({
    projectDomain: 'mock',
    locale: 'en',
    translations: mockTranslations,
    translationsError: null,
})

test('Translation does not exist. Expect to return fallback', () => {
    const missingTranslation = 'This translations should not exist.'
    const result = inlang.translate(missingTranslation).toString()
    expect(result).toEqual(missingTranslation)
})

test('Existing translation. Expect translation', () => {
    const text = 'About this app'
    const result = inlang.translate(text).toString()
    expect(result).toEqual(mockTranslations.byKey[text])
})

// test('Interpolation but variable is undefined -> throw an error ', () => {
//     expect(() => inlang.translate('You have {num} todos')).toThrow()
// })

test('Interpolation with one variable', () => {
    const result = inlang
        .translate('You have {num} todos')
        .variables({
            num: 2,
        })
        .toString()
    expect(result).toEqual('Du hast 2 Todos')
})

test('Interpolation with multiple variables', () => {
    const result = inlang
        .translate('You have {num} {color} todos')
        .variables({ num: 2, color: inlang.translate('green') })
        .toString()
    expect(result).toEqual('Du hast 2 grün Todos')
})
