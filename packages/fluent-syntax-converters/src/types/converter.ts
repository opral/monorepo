import { Result } from '@inlang/common';
import { SingleResource } from '@inlang/fluent-syntax';

/**
 * Each adapter must implement the interface.
 *
 * The underlying implementation can vastly differ per adapter.
 * For example, some adapters make us of PEG parsing, while others
 * "simply" parse and serialize with regular JavaScript/Typescript.
 */
export type Converter = {
    // TODO each converter should annotate what it's supports.
    // supports: {
    //     attributes: boolean;
    //     messages: boolean;
    //     references: boolean;
    //     selectors: boolean;
    //     variables: boolean;
    //     terms: boolean;
    // };
    parse(args: { data: string }): Result<SingleResource, Error>;
    serialize(args: { resource: SingleResource }): Result<string, Error>;
};
