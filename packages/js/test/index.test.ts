import * as inlang from '../src/index'
const mockTranslations = require('./mockTranslations.json')

beforeEach(() => {
    inlang.setTranslations(mockTranslations)
})

test('Translation does not exist. Expect to return fallback', () => {
    const missingTranslation = 'This translations should not exist.'
    expect(inlang.t(missingTranslation)).toEqual(missingTranslation)
})

test('Existing translation. Expect translation', () => {
    expect(inlang.t('About this app')).toEqual('Über diese App')
})


// t('You clicked the button {num} times.', vars: { num: 2 }, pluralize: {
//     zero: 'You have not clicked the button.',
//     one: 'You clicked the button once.',
//     two: 'You clicked the button twice.',
// })