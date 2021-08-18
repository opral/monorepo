import { MissingVariableError, UnknownVariableError } from '../src/errors'
import { InlangTextApi } from '../src/inlangTextApi'

test('Interpolate one variable', () => {
    const result = new InlangTextApi('Hello {user}')
        .interpolate({ user: 'Samuel' })
        .toString()
    expect(result).toEqual('Hello Samuel')
})

test('Interpolate one variable which is a number', () => {
    const result = new InlangTextApi('You have {num} todos')
        .interpolate({ num: 2 })
        .toString()
    expect(result).toEqual('You have 2 todos')
})

test('Interpolate multiple variables', () => {
    const result = new InlangTextApi('Hello {user}, today is {day} the {date}.')
        .interpolate({
            user: 'Samuel',
            day: 'Tuesday',
            date: '15.Aug 2021',
        })
        .toString()
    expect(result).toEqual('Hello Samuel, today is Tuesday the 15.Aug 2021.')
})

test('Throw an error if variable does not exist.', () => {
    expect(() =>
        new InlangTextApi('Hello {user}').interpolate({})
    ).toThrowError(MissingVariableError)
})

test('Throw an error if too many variables exist.', () => {
    expect(() =>
        new InlangTextApi('Hello {user}').interpolate({
            user: 'Samuel',
            day: 'Tuesday',
        })
    ).toThrowError(UnknownVariableError)
})
