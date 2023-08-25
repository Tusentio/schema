import type Path from "./path.js";

export interface Schema extends Record<string, unknown> {
    type: string;
}

export interface Options {
    minify?: boolean;
    throwOnError?: boolean;
}

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

export type CodeGenerator = (path: Path) => string;
