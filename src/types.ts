export interface SchemaBase<Type extends string> {
    type: {} & Type;
    [key: string]: unknown;
}

interface StringSchema extends SchemaBase<"string"> {}

interface NumberSchema extends SchemaBase<"number"> {
    allowNaN?: boolean;
    finite?: boolean;
}

interface IntegerSchema extends SchemaBase<"integer"> {
    allowNaN?: boolean;
}

interface BooleanSchema extends SchemaBase<"boolean"> {}

interface NullSchema extends SchemaBase<"null"> {}

interface AnySchema extends SchemaBase<"any"> {}

interface ConstSchema extends SchemaBase<"const"> {
    value: unknown;
}

interface UnionSchema extends SchemaBase<"union"> {
    variants: SchemaLike[];
}

type ObjectField = SchemaLike & { required?: boolean };

interface ObjectSchema extends SchemaBase<"object"> {
    fields: Record<string, ObjectField>;
    strict?: boolean;
}

interface TupleSchema extends SchemaBase<"tuple"> {
    items: SchemaLike[];
}

interface ArraySchema extends SchemaBase<"array"> {
    item: SchemaLike;
    length?: number;
    minLength?: number;
    maxLength?: number;
}

interface EnumSchema extends SchemaBase<"enum"> {
    variants: unknown[];
}

export type Schema<Type extends string = string> = SchemaBase<Type> &
    (
        | StringSchema
        | NumberSchema
        | IntegerSchema
        | BooleanSchema
        | NullSchema
        | AnySchema
        | ConstSchema
        | UnionSchema
        | ObjectSchema
        | TupleSchema
        | ArraySchema
        | EnumSchema
    );

export type SchemaLike = SchemaBase<string> | Schema;

export type SchemaType = Schema["type"];

export type TypeOf<S extends SchemaLike> = S extends Schema ? import("./typeof.js").TypeOf<S, []> : unknown;
