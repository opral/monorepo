/**
 * @jest-environment jsdom
 */

import { t } from '../src/index'
//@ts-ignore
import translations from '../translations/translations'

test('t() wrapper function', () => {
    document.documentElement.lang = 'de'
    const text = 'About this app'
    const result = t(text)
    expect(result).toEqual(translations[text]?.['de'])
})
