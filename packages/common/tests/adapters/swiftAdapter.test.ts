import { SwiftAdapter } from '../../src/adapters/swiftAdapter';

describe('SwiftAdapter', () => {
    const adapter = new SwiftAdapter();
    it('should parse a mock file without an error', () => {
        const result = adapter.parse(testFile);
        if (result.error) {
            console.error(result.error);
        }
        expect(result.data).not.toBeNull();
        expect(result.error).toBeNull();
    });

    it('should serialize without an error', () => {
        const parsing = adapter.parse(testFile);
        if (parsing.data === null) {
            throw parsing.error;
        }
        const serialization = adapter.serialize(parsing.data);
        expect(serialization.data).not.toBeNull();
        expect(serialization.error).toBeNull();
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


//Another comment

// MARK: - Introduction Guide
"letsGetStarted" = "Let's go!";
"redeemCode" = "Redeem code";

"keyWithNumber" = "1 month";

"kebap-case" = "The default Fluent style.";

`;
