import type { Schema } from "./types.js";
import { nullPrototype } from "./utils.js";

export type Transformer = (schema: Schema) => Schema;

const transformers = nullPrototype({
    enum(schema: Schema): Schema {
        const { variants } = schema;

        if (!Array.isArray(variants)) {
            throw new TypeError("Invalid enum variants.");
        }

        if (variants.length === 0) {
            throw new TypeError("An enum must have at least one variant.");
        }

        return {
            type: "union",
            variants: variants.map((variant) => ({ type: "const", value: variant })),
        };
    },
});

export function getTransformerNames(): string[] {
    return Object.keys(transformers);
}

export function getTransformer(name: keyof typeof transformers): Transformer;
export function getTransformer(name: string): Transformer | undefined;
export function getTransformer(name: string): Transformer | undefined {
    return (transformers as Record<string, Transformer | undefined>)[name];
}

export function registerTransformer(name: string, transformer: Transformer): boolean {
    if (name in transformers) return false;
    if (typeof transformer !== "function") throw new TypeError("Invalid transformer.");

    (transformers as Record<string, Transformer>)[name] = transformer;
    return true;
}

export function unregisterTransformer(name: string): boolean {
    return name in transformers && delete (transformers as Record<string, Transformer>)[name];
}
