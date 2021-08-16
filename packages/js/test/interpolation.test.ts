import { interpolate } from '../src/interpolate'
import { MissingVariableError } from '../src/errors'

test('Interpolate one variable', () => {
    expect(interpolate('Hello {user}', { user: 'Samuel' })).toEqual(
        'Hello Samuel'
    )
})

test('Interpolate one variable which is a number', () => {
    expect(interpolate('You have {num} todos', { num: 2 })).toEqual(
        'You have 2 todos'
    )
})

test('Interpolate multiple variables', () => {
    expect(
        interpolate('Hello {user}, today is {day} the {date}.', {
            user: 'Samuel',
            day: 'Tuesday',
            date: '15.Aug 2021',
        })
    ).toEqual('Hello Samuel, today is Tuesday the 15.Aug 2021.')
})

test('Throw an error if variable does not exist.', () => {
    expect(() => interpolate('Hello {user}', {})).toThrowError(
        MissingVariableError
    )
})

test('Throw an error if too many variables exist.', () => {
    expect(() =>
        interpolate('Hello {user}', {
            user: 'Samuel',
            day: 'Tuesday',
        })
    ).toThrow()
})
