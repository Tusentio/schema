import { minify as terser } from "terser";

import * as parsers from "./parsers.js";
import { joinPath, type Path } from "./path.js";
import type { SchemaLike, TypeOf } from "./types.js";
import type { MaybePromise } from "./utils.js";

export interface CompileOptions {
    minify?: boolean;
    throwOnError?: boolean;
}

interface ValidationErrorProperties {
    expected: SchemaLike;
    at: Path;
    got: unknown;
}

export class ValidationError extends TypeError implements ValidationErrorProperties {
    expected!: SchemaLike;
    at!: Path;
    got!: unknown;

    constructor(properties: ValidationErrorProperties) {
        const { expected, at } = properties;
        super(`Expected ${expected.type} at ${joinPath(at, false)}.`, { cause: { expected, at } });
        Object.assign(this, properties);
    }
}

export interface ValidatorProperties {
    source: string;
    error: ValidationError | null;
}

export type AssertionValidator<T = unknown> = ((value: unknown) => asserts value is T) & ValidatorProperties;

export type PredicateValidator<T = unknown> = ((value: unknown) => value is T) & ValidatorProperties;

export type Validator<T = unknown> = PredicateValidator<T> | AssertionValidator<T>;

export function compile<const S extends SchemaLike>(
    schema: S,
    options: CompileOptions & { minify: true; throwOnError: true },
): Promise<AssertionValidator<TypeOf<S>>>;

export function compile<const S extends SchemaLike>(
    schema: S,
    options: CompileOptions & { minify: true },
): Promise<PredicateValidator<TypeOf<S>>>;

export function compile<const S extends SchemaLike>(
    schema: S,
    options: CompileOptions & { throwOnError: true },
): AssertionValidator<TypeOf<S>>;

export function compile<const S extends SchemaLike>(schema: S, options: CompileOptions): PredicateValidator<TypeOf<S>>;

export function compile<const S extends SchemaLike>(schema: S): PredicateValidator<TypeOf<S>>;

export function compile(schema: SchemaLike, options: CompileOptions = {}): MaybePromise<Validator> {
    const { minify = false, throwOnError = false } = options;

    const source = throwOnError
        ? `(root, croak) => void ${parsers.parse(schema)(["root"])};`
        : `(root, croak) => ${parsers.parse(schema)(["root"])};`;

    const pack = (source: string) => {
        const fn = eval(source) as (value: unknown, croak: (reason: ValidationErrorProperties) => boolean) => boolean;

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

        const croak = (reason: ValidationErrorProperties) => {
            if (validate.error != null) {
                return false;
            }

            validate.error = new ValidationError(reason);

            if (throwOnError) {
                throw validate.error;
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
