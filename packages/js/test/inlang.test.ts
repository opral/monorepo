import * as inlang from '../src/inlang'
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
