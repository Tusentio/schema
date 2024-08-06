# @tusent.io/schema

## Contents

- [@tusent.io/schema](#tusentioschema)
  - [Contents](#contents)
  - [Types](#types)
    - [`string`](#string)
    - [`number`](#number)
    - [`integer`](#integer)
    - [`boolean`](#boolean)
    - [`null`](#null)
    - [`object`](#object)
    - [`array`](#array)
    - [`tuple`](#tuple)
    - [`const`](#const)
    - [`enum`](#enum)
    - [`union`](#union)
    - [`any`](#any)

## Types

### `string`

Matches any string value.

**Example:**

```json
{ "type": "string" }
```

### `number`

Matches any number value except positive and negative `Infinity`. By default, the number is not allowed to be `NaN`. To allow infinities or `NaN` values, set the `finite` option to `false` or the `allowNaN` option to `true` respectively.

- `allowNaN?: boolean` - Whether to allow `NaN` values. Defaults to `false`.
- `finite?: boolean` - Whether to disallow positive and negative `Infinity` values. Defaults to `true`.

**Example:**

```json
{
    "type": "number",
    "allowNaN": true
}
```

### `integer`

Matches any 32-bit integer value. By default, the number is not allowed to be `NaN`. To allow `NaN` values, set the `allowNaN` option to `true`.

- `allowNaN?: boolean` - Whether to allow `NaN` values. Defaults to `false`.

**Example:**

```json
{ "type": "integer" }
```

### `boolean`

Matches strictly `true` or `false`.

**Example:**

```json
{ "type": "boolean" }
```

### `null`

Matches either `null` or `undefined`.

**Example:**

```json
{ "type": "null" }
```

### `object`

Matches an object with specific properties. By default, all properties are required and the object is not allowed to have any additional properties. To allow additional properties, set the `strict` option to `false`.

- `fields: Record<string, Schema>` - An object of schemas to match against the object's properties.
  - `[key: string]: Schema` - The key is the name of the property and the value is the schema to match against the property.
    - `.required?: boolean` - Whether the property is required. Defaults to `true`.
- `strict?: boolean` - Whether to disallow additional properties. Defaults to `true`.

**Example:**

```json
{
    "type": "object",
    "fields": {
        "name": { "type": "string" },
        "age": { "type": "number" }
    }
}
```

### `array`

Matches an array with items matching a specific schema. By default, its length is not checked. To check its length, either use the `length` or `minLength`/`maxLength` options.

- `item: Schema` - The schema to match against all of the array's items.
- `length?: number` - Makes sure the array's length is equal to this specific value.
- `minLength?: number` - Makes sure the array's length is greater than or equal to this specific value. This option cannot be used together with the `length` option.
- `maxLength?: number` - Makes sure the array's length is less than or equal to this specific value. This option cannot be used together with the `length` option.

### `tuple`

Matches an array with a specific length and specific items.

- `items: Schema[]` - An array of schemas to match against the array's items.

**Example:** The following schema will match an array with two items, the first being a string and the second being a
number.

```json
{
    "type": "tuple",
    "items": [{ "type": "string" }, { "type": "number" }]
}
```

### `const`

Matches a specific value. Supports deep equality checks for objects and arrays.

- `value: any` - The value to match.

**Example:**

```json
{
    "type": "const",
    "value": 42
}
```

### `enum`

Matches a specific set of values.

- `variants: unknown[]` - An array of values to match against. Each variant is matched like a [`const`](#const)
    schema. (Must have at least one item.)

### `union`

Matches any of the given schemas.

- `variants: Schema[]` - An array of schemas to match against. (Must have at least one item.)

**Example:**

```json
{
    "type": "union",
    "variants": [{ "type": "string" }, { "type": "number" }]
}
```

### `any`

Matches any value including `undefined` and `null`.

**Example:**

```json
{ "type": "any" }
```
