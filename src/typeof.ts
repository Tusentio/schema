import type { Schema, SchemaLike, SchemaType } from "./types.js";
import type { ExcludeKeys, ExtractKeys, PartialRecord } from "./utils.js";

type TypeOfString = string;

type TypeOfNumber = number;

type TypeOfInteger = number;

type TypeOfBoolean = boolean;

type TypeOfNull = null | undefined;

type TypeOfAny = unknown;

type TypeOfConst<S> = S extends Schema<"const"> ? S["value"] : never;

type TypeOfUnion<S, D extends {}[]> = S extends Schema<"union"> ? TypeOf<S["variants"][number], D> : never;

type TypeOfObject<S, D extends {}[]> =
    S extends Schema<"object">
        ? {
              [K in ExcludeKeys<S["fields"], { required: false }>]-?: TypeOf<S["fields"][K], D>;
          } & {
              [K in ExtractKeys<S["fields"], { required: false }>]?: TypeOf<S["fields"][K], D>;
          } & (S extends { strict: false } ? PartialRecord<string, unknown> : {}) extends infer T
            ? { [K in keyof T]: T[K] }
            : never
        : never;

type TypeOfTuple<S, D extends {}[]> =
    S extends Schema<"tuple"> ? { [K in keyof S["items"]]: TypeOf<S["items"][K], D> } : never;

type TypeOfArray<S, D extends {}[]> = S extends Schema<"array"> ? TypeOf<S["item"], D>[] : never;

type TypeOfEnum<S> = S extends Schema<"enum"> ? S["variants"][number] : never;

export type TypeOf<S, D extends {}[]> = D["length"] extends 24
    ? unknown
    : S extends SchemaLike
      ? S["type"] extends SchemaType
          ? {
                ["string"]: TypeOfString;
                ["number"]: TypeOfNumber;
                ["integer"]: TypeOfInteger;
                ["boolean"]: TypeOfBoolean;
                ["null"]: TypeOfNull;
                ["any"]: TypeOfAny;
                ["const"]: TypeOfConst<S>;
                ["union"]: TypeOfUnion<S, [...D, {}]>;
                ["object"]: TypeOfObject<S, [...D, {}]>;
                ["tuple"]: TypeOfTuple<S, [...D, {}]>;
                ["array"]: TypeOfArray<S, [...D, {}]>;
                ["enum"]: TypeOfEnum<S>;
            }[S["type"]]
          : unknown
      : never;
