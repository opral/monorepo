import { Inlang } from '../src/inlang'
import { InlangProjectConfig, Translations } from '../src/types'
//@ts-ignore
import translations from '../translations/translations'
//@ts-ignore
import projectConfig from '../translations/config'

const mockTranslations: Translations = translations

const inlang = new Inlang({
    projectConfig: projectConfig as InlangProjectConfig,
    locale: 'de',
    translations: mockTranslations,
})

test('Translation does not exist. Expect to return fallback', () => {
    const missingTranslation = 'This translations should not exist.'
    const result = inlang.translate(missingTranslation)
    expect(result).toEqual(missingTranslation)
})

test('Existing translation. Expect translation', () => {
    const text = 'About this app'
    const result = inlang.translate(text)
    expect(result).toEqual(mockTranslations[text]?.['de'])
})

// test('Interpolation but variable is undefined -> throw an error ', () => {
//     expect(() => inlang.translate('You have {num} todos')).toThrow()
// })

test('Interpolation with one variable', () => {
    const result = inlang.translate('You have {num} todos', {
        vars: { num: 2 },
    })
    expect(result).toEqual('Du hast 2 Todos')
})

test('Interpolation with multiple variables', () => {
    const result = inlang.translate('You have {num} {color} todos', {
        vars: {
            num: 2,
            color: inlang.translate('green'),
        },
    })
    expect(result).toEqual('Du hast 2 grün Todos')
})
