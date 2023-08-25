import type { Schema } from "./types.js";
import { nullPrototype, isObject, isArray, isUnsignedSize, isSchema, stringifyJS } from "./utils.js";
import { type Path, joinPath, index } from "./path.js";
import { getTransformer } from "./transformers.js";

export type CodeGenerator = (path: Path) => string;
export type Parser = (schema: Schema) => CodeGenerator;

const parsers = nullPrototype({
    string(): CodeGenerator {
        return (path) => `typeof ${joinPath(path)} === "string"`;
    },

    number(): CodeGenerator {
        return (path) => {
            const arg = joinPath(path);
            return `${arg} === +${arg}`;
        };
    },

    boolean(): CodeGenerator {
        return (path) => {
            const arg = joinPath(path);
            return `${arg} === !!${arg}`;
        };
    },

    null(): CodeGenerator {
        return (path) => `${joinPath(path)} == null`;
    },

    const(schema: Schema): CodeGenerator {
        const { value } = schema;

        if (!("value" in schema)) {
            throw new TypeError("Missing const value.");
        }

        if (value != null && typeof value === "object") {
            return parsers.object({
                type: "object",
                fields: Object.fromEntries(
                    Object.entries(value).map(([key, value]) => [
                        key,
                        {
                            type: "const",
                            required: true,
                            value,
                        },
                    ])
                ),
            });
        } else {
            return (path) => `${joinPath(path)} === ${stringifyJS(value)}`;
        }
    },

    object(schema: Schema): CodeGenerator {
        const { fields } = schema;
        if (!isObject(fields)) throw new TypeError("Invalid object fields.");

        for (const key in fields) {
            if (!isSchema(fields[key])) {
                throw new TypeError(`Invalid field schema: ${stringifyJS(fields[key])}.`);
            }
        }

        const keys = Object.keys(fields);

        const requiredKeys = keys.filter((key) => {
            const field = fields[key] as Schema;
            return field.required !== false;
        });

        return (path) => {
            const arg = joinPath(path);

            const nullCheck = `${arg} != null`;
            const typeCheck = `typeof ${arg} === "object"`;
            const keysCheck =
                keys.length === requiredKeys.length && `Object.keys(${arg}).length === ${stringifyJS(keys.length)}`;
            const maxKeysCheck = !keysCheck && `Object.keys(${arg}).length <= ${stringifyJS(keys.length)}`;
            const minKeysCheck =
                !keysCheck &&
                requiredKeys.length &&
                `Object.keys(${arg}).length >= ${stringifyJS(requiredKeys.length)}`;
            const requiredFieldsCheck =
                requiredKeys.length && requiredKeys.map((key) => `${stringifyJS(key)} in ${arg}`).join(" && ");

            const extraFieldsCheck =
                keys.length &&
                !keysCheck &&
                `Object.keys(${arg}).every((key) => ${keys.map((key) => `key === ${stringifyJS(key)}`).join(" || ")})`;

            const valueCheck =
                keys.length &&
                keys
                    .map((key) => {
                        const field = fields[key] as Schema;
                        return `(!(${stringifyJS(key)} in ${arg}) || (${parse(field)([...path, key])}))`;
                    })
                    .join(" && ");

            return [
                nullCheck,
                typeCheck,
                keysCheck,
                maxKeysCheck,
                minKeysCheck,
                requiredFieldsCheck,
                extraFieldsCheck,
                valueCheck,
            ]
                .filter(Boolean)
                .join(" && ");
        };
    },

    tuple(schema: Schema): CodeGenerator {
        const { items } = schema;
        if (!isArray(items)) throw new TypeError("Invalid tuple items.");

        for (const item of items) {
            if (!isSchema(item)) {
                new TypeError(`Invalid item schema: ${stringifyJS(schema)}.`);
            }
        }

        return (path) => {
            const arg = joinPath(path);

            const nullCheck = `!(${parsers.null()(path)})`;
            const typeCheck = `typeof ${arg} === "object"`;
            const lengthCheck = `${arg}.length === ${stringifyJS(items.length)}`;
            const arrayCheck = `Array.isArray(${arg})`;

            const valueCheck = items.length && items.map((item, i) => parse(item)([...path, i])).join(" && ");

            return [nullCheck, typeCheck, lengthCheck, arrayCheck, valueCheck].filter(Boolean).join(" && ");
        };
    },

    array(schema: Schema): CodeGenerator {
        const { item, length } = schema;

        if (!isSchema(item)) {
            throw new TypeError(`Invalid item schema: ${stringifyJS(item)}.`);
        }

        if (length != null && !isUnsignedSize(length)) {
            throw new TypeError(`Invalid array length: ${stringifyJS(length)}.`);
        }

        return (path) => {
            const arg = joinPath(path);

            const nullCheck = `!(${parsers.null()(path)})`;
            const typeCheck = `typeof ${arg} === "object"`;
            const lengthCheck = length != null && `${arg}.length === ${stringifyJS(length)}`;
            const arrayCheck = `Array.isArray(${arg})`;
            const valueCheck = length && `${arg}.every((_, i) => ${parse(item)([...path, index(["i"])])})`;

            return [nullCheck, typeCheck, lengthCheck, arrayCheck, valueCheck].filter(Boolean).join(" && ");
        };
    },
});

function wipe(o: Record<any, unknown>) {
    Object.setPrototypeOf(o, Object.prototype);
    for (const key in o) delete o[key];
}

function resolve(schema: Schema): Parser | undefined {
    for (let i = 0; i < 0x100; i++) {
        const type = schema.type.replace(/::.*/s, "");
        const parser = getParser(type);
        if (parser) return parser;

        const transformer = getTransformer(type);
        if (!transformer) return undefined;

        const old = structuredClone(schema);
        wipe(schema);

        const transformed = structuredClone(transformer(old));
        Object.assign(schema, transformed);
    }

    throw new TypeError("Too many schema transformations.");
}

export function parse(schema: unknown): CodeGenerator {
    schema = structuredClone(schema);
    if (!isSchema(schema)) throw new TypeError(`Invalid schema: ${stringifyJS(schema)}.`);

    const parser = resolve(schema);
    if (parser == null) throw new TypeError(`Invalid schema type: ${stringifyJS(schema.type)}.`);

    return (path: Path) =>
        `(${parser(schema as Schema)(path)} || croak(${stringifyJS({
            expected: schema,
            at: path.slice(1),
        })}))`;
}

export function getParserNames(): string[] {
    return Object.keys(parsers);
}

export function getParser(name: keyof typeof parsers): Parser;
export function getParser(name: string): Parser | undefined;
export function getParser(name: string): Parser | undefined {
    return (parsers as Record<string, Parser | undefined>)[name];
}

export function registerParser(name: string, parser: Parser): boolean {
    if (name in parsers) return false;
    if (typeof parser !== "function") throw new TypeError("Invalid parser.");

    (parsers as Record<string, Parser>)[name] = parser;
    return true;
}

export function unregisterParser(name: string): boolean {
    return name in parsers && delete (parsers as Record<string, Parser>)[name];
}
