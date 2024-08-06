export interface SchemaBase<Type extends string> {
    type: Type & {};
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
    variants: (Schema | SchemaLike)[];
}

type ObjectField = (Schema | SchemaLike) & { required?: boolean };

interface ObjectSchema extends SchemaBase<"object"> {
    fields: Record<string, ObjectField>;
    strict?: boolean;
}

interface TupleSchema extends SchemaBase<"tuple"> {
    items: (Schema | SchemaLike)[];
}

interface ArraySchema extends SchemaBase<"array"> {
    item: Schema | SchemaLike;
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

export type SchemaLike = SchemaBase<string> & Partial<Record<string, unknown>>;

export type SchemaType = Schema["type"];

export type TypeOf<S extends Schema | SchemaLike> = S extends Schema ? import("./typeof.js").TypeOf<S, []> : unknown;
