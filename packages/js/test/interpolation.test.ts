import { interpolate } from '../src/interpolate'

test('Interpolate one variable', () => {
    expect(interpolate('Hello {user}', { user: 'Samuel' })).toEqual(
        'Hello Samuel'
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
    expect(() => interpolate('Hello {user}', {})).toThrow()
})

test('Throw an error if too many variables exist.', () => {
    expect(() =>
        interpolate('Hello {user}', {
            user: 'Samuel',
            day: 'Tuesday',
        })
    ).toThrow()
})
