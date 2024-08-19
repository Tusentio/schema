import { index, joinPath, resolveRuntimePath, type Path } from "./path.js";
import { $$$_this_can_allow_remote_code_execution_$$$, stringify } from "./stringify.js";
import { getTransformer } from "./transformers.js";
import type { SchemaLike } from "./types.js";
import { cloningCall, isRecord, isSchema, isUnsignedSize, nullPrototype, type PartialRecord } from "./utils.js";

export type CodeGenerator = (path: Path) => string;

export type Parser = (input: { schema: SchemaLike; parse: typeof parse }) => CodeGenerator;

const parsers = nullPrototype({
    string() {
        return (path) => `typeof ${joinPath(path)} === "string"`;
    },

    number({ schema }) {
        const { allowNaN = false, finite = true } = schema;

        return (path) => {
            const arg = joinPath(path);

            const typeCheck = `typeof ${arg} === "number"`;
            const nanCheck = allowNaN != true ? `!Number.isNaN(${arg})` : null;
            const finiteCheck = finite != false ? `(Number.isNaN(${arg}) || Number.isFinite(${arg}))` : null;

            return [typeCheck, nanCheck, finiteCheck].filter(Boolean).join(" && ");
        };
    },

    integer({ schema }) {
        const { allowNaN = false } = schema;

        return (path) => {
            const arg = joinPath(path);

            const typeCheck = `typeof ${arg} === "number"`;
            const nanCheck = allowNaN != true && `!Number.isNaN(${arg})`;
            const integerCheck = `(Number.isNaN(${arg}) || Number.isInteger(${arg}))`;

            return [typeCheck, nanCheck, integerCheck].filter(Boolean).join(" && ");
        };
    },

    boolean() {
        return (path) => {
            const arg = joinPath(path);
            return `${arg} === true || ${arg} === false`;
        };
    },

    null() {
        return (path) => `${joinPath(path)} == null`;
    },

    any() {
        return () => "true";
    },

    const({ schema, parse }): CodeGenerator {
        const { value } = schema;

        if (!("value" in schema)) {
            throw new TypeError("Missing const value.");
        }

        if (isRecord(value)) {
            return getParser("object")({
                schema: {
                    type: "object",
                    fields: Object.fromEntries(
                        Object.entries(value).map(([key, value]) => [key, { type: "const", value }]),
                    ),
                },
                parse,
            });
        } else {
            return (path) => `${joinPath(path)} === ${stringify(value)}`;
        }
    },

    union({ schema, parse }) {
        const { variants } = schema;

        if (!Array.isArray(variants)) {
            throw new TypeError("Invalid union variants.");
        }

        if (variants.length === 0) {
            throw new TypeError("A union must have at least one variant.");
        }

        const variantSchemas = variants.map((variant) => {
            if (isSchema(variant)) {
                return variant;
            } else {
                throw new TypeError(`Invalid variant schema: ${stringify(variant)}.`);
            }
        });

        return (path) => {
            return variantSchemas.map((variant) => parse(variant, false)(path)).join(" || ");
        };
    },

    object({ schema, parse }) {
        const fields = schema.fields;
        const strict = schema.strict !== false;

        if (!isRecord(fields)) {
            throw new TypeError("Missing or invalid object fields.");
        }

        const fieldSchemas = Object.fromEntries(
            Object.entries(fields).map(([key, value]) => {
                if (isSchema(value)) {
                    return [key, value];
                } else {
                    throw new TypeError(`Invalid field schema: ${stringify(value)}.`);
                }
            }),
        );

        const keys = Object.keys(fieldSchemas);

        const requiredKeys = keys.filter((key) => {
            const schema = fieldSchemas[key];
            return schema.required != false;
        });

        return (path) => {
            const arg = joinPath(path);

            const typeCheck = `${arg} != null && typeof ${arg} === "object"`;

            const checkKeys = strict && keys.length === requiredKeys.length;
            const keysCheck = checkKeys ? `Object.keys(${arg}).length === ${stringify(keys.length)}` : null;

            const maxKeysCheck =
                strict && !checkKeys ? `Object.keys(${arg}).length <= ${stringify(keys.length)}` : null;

            const minKeysCheck =
                !checkKeys && requiredKeys.length > 0
                    ? `Object.keys(${arg}).length >= ${stringify(requiredKeys.length)}`
                    : null;

            const requiredFieldsCheck =
                requiredKeys.length > 0 ? requiredKeys.map((key) => `${stringify(key)} in ${arg}`).join(" && ") : null;

            const extraFieldsCheck =
                !checkKeys && keys.length > 0
                    ? `Object.keys(${arg}).every((key) => ${keys
                          .map((key) => `key === ${stringify(key)}`)
                          .join(" || ")})`
                    : null;

            const valueCheck =
                keys.length > 0
                    ? keys
                          .map((key) => {
                              const schema = fieldSchemas[key];
                              return `(!(${stringify(key)} in ${arg}) || (${parse(schema)([...path, key])}))`;
                          })
                          .join(" && ")
                    : null;

            return [typeCheck, keysCheck, maxKeysCheck, minKeysCheck, requiredFieldsCheck, extraFieldsCheck, valueCheck]
                .filter(Boolean)
                .join(" && ");
        };
    },

    tuple({ schema, parse }) {
        let { items } = schema;
        items ??= schema.item;

        if (!Array.isArray(items)) {
            throw new TypeError("Invalid tuple items.");
        }

        const itemSchemas = items.map((item) => {
            if (isSchema(item)) {
                return item;
            } else {
                throw new TypeError(`Invalid item schema: ${stringify(schema)}.`);
            }
        });

        return (path) => {
            const arg = joinPath(path);

            const typeCheck = `${arg} != null && typeof ${arg} === "object"`;
            const lengthCheck = `${arg}.length === ${stringify(items.length)}`;
            const arrayCheck = `Array.isArray(${arg})`;

            const valueCheck =
                itemSchemas.length && itemSchemas.map((item, i) => parse(item)([...path, i])).join(" && ");

            return [typeCheck, lengthCheck, arrayCheck, valueCheck].filter(Boolean).join(" && ");
        };
    },

    array({ schema, parse }) {
        const { length, minLength, maxLength } = schema;

        let { item } = schema;
        item ??= schema.items;

        if (!isSchema(item)) {
            throw new TypeError(`Invalid item schema: ${stringify(item)}.`);
        }

        if (length != null && !isUnsignedSize(length)) {
            throw new TypeError(`Invalid array length: ${stringify(length)}.`);
        }

        if (minLength != null && !isUnsignedSize(minLength)) {
            throw new TypeError(`Invalid array minLength: ${stringify(minLength)}.`);
        }

        if (maxLength != null && !isUnsignedSize(maxLength)) {
            throw new TypeError(`Invalid array maxLength: ${stringify(maxLength)}.`);
        }

        if (length != null && (maxLength != null || minLength != null)) {
            throw new TypeError("Array length and maxLength/minLength cannot be used together.");
        }

        return (path) => {
            const arg = joinPath(path);

            const typeCheck = `${arg} != null && typeof ${arg} === "object"`;
            const lengthCheck = length != null ? `${arg}.length === ${stringify(length)}` : null;
            const minLengthCheck = minLength != null ? `${arg}.length >= ${stringify(minLength)}` : null;
            const maxLengthCheck = maxLength != null ? `${arg}.length <= ${stringify(maxLength)}` : null;
            const arrayCheck = `Array.isArray(${arg})`;
            const valueCheck =
                (length == null || length > 0) && (maxLength == null || maxLength > 0)
                    ? `${arg}.every((_, i) => ${parse(item)([...path, index(["i"])])})`
                    : null;

            return [typeCheck, lengthCheck, minLengthCheck, maxLengthCheck, arrayCheck, valueCheck]
                .filter(Boolean)
                .join(" && ");
        };
    },
} satisfies PartialRecord<string, Parser>);

function resolve(
    schema: SchemaLike,
    parse: (schema: SchemaLike, croak?: boolean) => CodeGenerator,
): CodeGenerator | undefined {
    schema = structuredClone(schema);

    for (let i = 0; i < 0x100; i++) {
        const type = schema.type.replace(/::.*/s, "");

        const parser = getParser(type);
        if (parser) {
            return parser({ schema, parse });
        }

        const transformer = getTransformer(type);
        if (!transformer) {
            return undefined;
        }

        schema = cloningCall(transformer, schema);
    }

    throw new TypeError("Too many schema transformations.");
}

export function parse(schema: SchemaLike, croak = true): CodeGenerator {
    schema = structuredClone(schema);

    if (!isSchema(schema)) {
        throw new TypeError(`Invalid schema: ${stringify(schema)}.`);
    }

    const generator = resolve(schema, (schema, _croak = croak) => parse(schema, _croak));
    if (generator == null) {
        throw new TypeError(`Invalid schema type: ${stringify(schema.type)}.`);
    }

    return (path: Path) => {
        if (!isSchema(schema)) {
            throw new TypeError(`Invalid schema: ${stringify(schema)}.`);
        }

        if (croak) {
            return `((${generator(path)}) || croak(${stringify({
                expected: schema,
                at: resolveRuntimePath(path.slice(1)),
                got: $$$_this_can_allow_remote_code_execution_$$$(joinPath(path)),
            })}))`;
        } else {
            return `(${generator(path)})`;
        }
    };
}

export function getParserNames(): string[] {
    return Object.keys(parsers);
}

export function getParser(name: keyof typeof parsers): Parser;
export function getParser(name: string): Parser | undefined;
export function getParser(name: string): Parser | undefined {
    return (parsers as PartialRecord<string, Parser>)[name];
}

export function registerParser(name: string, parser: Parser): boolean {
    if (name in parsers) {
        return false;
    }

    if (typeof parser !== "function") {
        throw new TypeError("The parser must be a function.");
    }

    (parsers as PartialRecord<string, Parser>)[name] = parser;
    return true;
}

export function unregisterParser(name: string): boolean {
    return name in parsers && delete (parsers as PartialRecord<string, Parser>)[name];
}
