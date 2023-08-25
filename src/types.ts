export interface Schema extends Record<string, unknown> {
    type: string;
}

export interface Options {
    minify?: boolean;
    throwOnError?: boolean;
}
