import { LocalizableStringsConverter } from './converter';

describe('LocalizableStringsAdapter', () => {
    const adapter = new LocalizableStringsConverter();
    it('should parse ok', () => {
        const result = adapter.parse({ data: testFile });
        expect(result.isOk);
    });

    it('should serialize ok', () => {
        const parse = adapter.parse({ data: testFile });
        if (parse.isErr) throw parse.error;
        const serialize = adapter.serialize({ resource: parse.value });
        expect(serialize.isOk);
    });

    it('should have the same abstract syntax trees after multiple parsings and serializations', () => {
        const parse1 = adapter.parse({ data: testFile });
        if (parse1.isErr) throw parse1.error;
        const serialize1 = adapter.serialize({ resource: parse1.value });
        if (serialize1.isErr) throw serialize1.error;
        const parse2 = adapter.parse({ data: serialize1.value });
        if (parse2.isErr) throw parse2.error;
        expect(parse1.value).toEqual(parse2.value);
    });
});

const testFile = `
/*
  A mutli-line
  commment lalalalala.

*/

"WrongPassword" = "Wrong Password";


// MARK: - Comment
"CamelCaseKey" = "Something went wrong";
"snake_case_key" = "An error occured while logging in. Please try again";

// interpolation
"some-key" = "Hello %s";


//Another comment

// MARK: - Introduction Guide
"letsGetStarted" = "Let's go!";
"redeemCode" = "Redeem code";

"keyWithNumber" = "1 month";

"kebap-case" = "The default Fluent style.";

`;
