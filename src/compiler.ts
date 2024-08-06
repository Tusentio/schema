import { minify as terser } from "terser";

import type { TypeOf } from "./index.js";
import * as parsers from "./parsers.js";
import { joinPath, type Path } from "./path.js";
import type { SchemaLike } from "./types.js";
import type { MaybePromise } from "./utils.js";

export interface CompileOptions {
    minify?: boolean;
    throwOnError?: boolean;
}

export interface ValidationError {
    expected: Readonly<SchemaLike>;
    at: Path;
}

export interface ValidatorProperties {
    source: string;
    error: ValidationError | null;
}

export type AssertionValidator<T = unknown> = ((value: unknown) => asserts value is T) & ValidatorProperties;

export type PredicateValidator<T = unknown> = ((value: unknown) => value is T) & ValidatorProperties;

export type Validator<T = unknown> = PredicateValidator<T> | AssertionValidator<T>;

export function compile<const Schema extends SchemaLike>(
    schema: Readonly<Schema>,
    options: CompileOptions & { minify: true; throwOnError: true },
): Promise<AssertionValidator<TypeOf<Schema>>>;

export function compile<const Schema extends SchemaLike>(
    schema: Readonly<Schema>,
    options: CompileOptions & { minify: true },
): Promise<PredicateValidator<TypeOf<Schema>>>;

export function compile<const Schema extends SchemaLike>(
    schema: Readonly<Schema>,
    options: CompileOptions & { throwOnError: true },
): AssertionValidator<TypeOf<Schema>>;

export function compile<const Schema extends SchemaLike>(
    schema: Readonly<Schema>,
    options: CompileOptions,
): PredicateValidator<TypeOf<Schema>>;

export function compile<const Schema extends SchemaLike>(schema: Readonly<Schema>): PredicateValidator<TypeOf<Schema>>;

export function compile(schema: Readonly<SchemaLike>, options: CompileOptions = {}): MaybePromise<Validator> {
    const { minify = false, throwOnError = false } = options;

    const source = throwOnError
        ? `(root, croak) => void ${parsers.parse(schema)(["root"])};`
        : `(root, croak) => ${parsers.parse(schema)(["root"])};`;

    const pack = (source: string) => {
        const fn = eval(source) as (value: unknown, croak: (reason: ValidationError) => boolean) => boolean;

        const validate = Object.assign(
            (value: unknown) => {
                validate.error = null;
                return fn(value, croak);
            },
            {
                source,
                error: null as ValidationError | null,
            },
        );

        const croak = (reason: ValidationError) => {
            if (validate.error != null) {
                return false;
            }

            validate.error = reason;

            if (throwOnError) {
                throw new TypeError(`Expected ${reason.expected.type} at ${joinPath(["root", ...reason.at])}.`, {
                    cause: reason,
                });
            } else {
                return false;
            }
        };

        return validate;
    };

    if (minify) {
        return terser(source, { compress: { expression: true } })
            .then((result) => result.code!)
            .then(pack);
    } else {
        return pack(source);
    }
}
