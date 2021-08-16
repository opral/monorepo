import * as inlang from '../src/index'

// using english to english translations for easier testing
const mockTranslations = {
    _inlangProjectDevelopmentLocale: 'en',
    'About this app': 'About this app',
    'You have {num} todos': 'You have {num} todos',
    'You have {num} {color} todos': 'You have {num} {color} todos',
}

beforeEach(() => {
    inlang.setTranslations(mockTranslations)
})

test('Translation does not exist. Expect to return fallback', () => {
    const missingTranslation = 'This translations should not exist.'
    expect(inlang.t(missingTranslation)).toEqual(missingTranslation)
})

test('Existing translation. Expect translation', () => {
    // bad test
    expect(inlang.t('About this app')).toEqual('About this app')
})

test('Interpolation but variable is undefined -> throw an error ', () => {
    expect(() => inlang.t('You have {num} todos')).toThrow()
})

test('Interpolation with one variable', () => {
    const result = inlang.t('You have {num} todos', { vars: { num: 2 } })
    expect(result).toEqual('You have 2 todos')
})

test('Interpolation with multiple variables', () => {
    const result = inlang.t('You have {num} {color} todos', {
        vars: { num: 2, color: 'green' },
    })
    expect(result).toEqual('You have 2 green todos')
})

// t('You clicked the button {num} times.', vars: { num: 2 }, pluralize: {
//     zero: 'You have not clicked the button.',
//     one: 'You clicked the button once.',
//     two: 'You clicked the button twice.',
// })
