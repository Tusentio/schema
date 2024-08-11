type SchemaBase<Type extends string> = Record<string, unknown> & { type: Type & {} };

type StringSchema = SchemaBase<"string">;

type NumberSchema = SchemaBase<"number"> & {
    allowNaN?: boolean;
    finite?: boolean;
};

type IntegerSchema = SchemaBase<"integer"> & {
    allowNaN?: boolean;
};

type BooleanSchema = SchemaBase<"boolean">;

type NullSchema = SchemaBase<"null">;

type AnySchema = SchemaBase<"any">;

type ConstSchema = SchemaBase<"const"> & {
    value: unknown;
};

type UnionSchema = SchemaBase<"union"> & {
    variants: SchemaLike[];
};

type ObjectField = SchemaLike & { required?: boolean };

type ObjectSchema = SchemaBase<"object"> & {
    fields: Record<string, ObjectField>;
    strict?: boolean;
};

type TupleSchema = SchemaBase<"tuple"> & {
    items: SchemaLike[];
};

type ArraySchema = SchemaBase<"array"> & {
    item: SchemaLike;
    length?: number;
    minLength?: number;
    maxLength?: number;
};

type EnumSchema = SchemaBase<"enum"> & {
    variants: unknown[];
};

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

export type SchemaLike = Schema | SchemaBase<string>;

export type SchemaType = Schema["type"];

export type TypeOf<S extends SchemaLike> = S extends Schema ? import("./typeof.js").TypeOf<S, []> : unknown;
