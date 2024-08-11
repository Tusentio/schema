import type { SchemaLike } from "./types.js";
import { nullPrototype, type PartialRecord } from "./utils.js";

export type Transformer = (schema: SchemaLike) => SchemaLike;

const transformers = nullPrototype({
    enum(schema) {
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
} satisfies PartialRecord<string, Transformer>);

export function getTransformerNames(): string[] {
    return Object.keys(transformers);
}

export function getTransformer(name: keyof typeof transformers): Transformer;
export function getTransformer(name: string): Transformer | undefined;
export function getTransformer(name: string): Transformer | undefined {
    return (transformers as PartialRecord<string, Transformer>)[name];
}

export function registerTransformer(name: string, transformer: Transformer): boolean {
    if (name in transformers) {
        return false;
    }

    if (typeof transformer !== "function") {
        throw new TypeError("Invalid transformer.");
    }

    (transformers as PartialRecord<string, Transformer>)[name] = transformer;
    return true;
}

export function unregisterTransformer(name: string): boolean {
    return name in transformers && delete (transformers as PartialRecord<string, Transformer>)[name];
}
