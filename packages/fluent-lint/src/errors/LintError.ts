import {
    BaseNode,
    FunctionReference,
    Message,
    MessageReference,
    Term,
    TermReference,
    VariableReference,
} from '@inlang/fluent-syntax';
import { LintArguments } from '../types/LintArguments';

export class LintError extends Error {
    static withDefaultMessage(args: { prefix: string; expected: string; received: string }): LintError {
        return new LintError(`${args.prefix} Expected ${args.expected} but received ${args.received}.`);
    }

    static idMismatch(
        args: LintArguments<FunctionReference | MessageReference | Message | Term | TermReference | VariableReference>
    ): LintError {
        return LintError.withDefaultMessage({
            prefix: `Id mismatch for ${args.source.type}:`,
            expected: args.source.id.name,
            received: args.target.id.name,
        });
    }

    static typeMismatch(args: LintArguments<BaseNode>): LintError {
        return LintError.withDefaultMessage({
            prefix: 'Type mismatch:',
            expected: args.source.type,
            received: args.target.type,
        });
    }

    constructor(message: string) {
        super(message);
    }
}
