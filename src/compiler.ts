import { minify as terser } from "terser";

import type { Schema, Options } from "./types.js";
import { type Path, joinPath } from "./path.js";
import * as parsers from "./parsers.js";

export interface ValidationError {
    expected: Schema;
    at: Path;
}

export type ValidatorFunction<O extends Options = {}> = ((
    value: any
) => O extends { throwOnError: false } ? boolean : void) & {
    source: string;
    error: ValidationError | null;
};

export function compile<Opts extends Options & { minify: true }>(
    schema: Schema,
    options: Opts
): Promise<ValidatorFunction<Opts>>;

export function compile<Opts extends Options>(schema: Schema, options: Opts): ValidatorFunction<Opts>;

export function compile(schema: Schema): ValidatorFunction;

export function compile(
    schema: Schema,
    options: Options = {}
): ValidatorFunction | Promise<ValidatorFunction<typeof options>> {
    const { minify = false, throwOnError = false } = options;

    const source = throwOnError
        ? `(root, croak) => void ${parsers.parse(schema)(["root"])};`
        : `(root, croak) => ${parsers.parse(schema)(["root"])};`;

    const pack = (source: string) => {
        const fn = eval(source);

        const validate = Object.assign(
            (value: any) => {
                validate.error = null;
                return fn(value, croak);
            },
            {
                source,
                error: null as ValidationError | null,
            }
        );

        const croak = (reason: ValidationError) => {
            if (validate.error != null) return false;

            if (throwOnError) {
                throw Object.assign(
                    new TypeError(`Expected ${reason.expected.type} at ${joinPath(reason.at)}.`),
                    reason
                );
            } else {
                validate.error = reason;
                return false;
            }
        };

        return validate;
    };

    if (minify) {
        return terser(source, {
            compress: { expression: true },
        })
            .then((result) => result.code!)
            .then(pack);
    } else {
        return pack(source);
    }
}
