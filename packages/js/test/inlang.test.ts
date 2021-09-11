import { Inlang } from '../src/inlang'
// @ts-ignore
import mockTranslations from '../locales/de'

const inlang = new Inlang({
    config: {
        projectId: 'mock',
        developmentLocale: 'en',
        locales: ['de'],
    },
    locale: 'en',
    translations: {
        'About this app': 'Über diese App',
        'You have {num} todos': 'Du hast {num} Todos',
        'You have {num} {color} todos': 'Du hast {num} {color} Todos',
        green: 'grün',
    },
})

test('Translation does not exist. Expect to return fallback', () => {
    console.log(mockTranslations)
    const missingTranslation = 'This translations should not exist.'
    const result = inlang.textApi(missingTranslation).toString()
    expect(result).toEqual(missingTranslation)
})

test('Existing translation. Expect translation', () => {
    const text = 'About this app'
    const result = inlang.textApi(text).toString()
    expect(result).toEqual(mockTranslations[text])
})

// test('Interpolation but variable is undefined -> throw an error ', () => {
//     expect(() => inlang.translate('You have {num} todos')).toThrow()
// })

test('Interpolation with one variable', () => {
    const result = inlang
        .textApi('You have {num} todos')
        .variables({
            num: 2,
        })
        .toString()
    expect(result).toEqual('Du hast 2 Todos')
})

test('Interpolation with multiple variables', () => {
    const result = inlang
        .textApi('You have {num} {color} todos')
        .variables({ num: 2, color: inlang.textApi('green') })
        .toString()
    expect(result).toEqual('Du hast 2 grün Todos')
})
