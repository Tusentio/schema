import { isIdent } from "./utils.js";

const rawStrings = new WeakMap<object, string>();

/**
 * Creates an object that will be stringified as the given string.
 *
 * MAY LEAD TO REMOTE CODE EXECUTION IF USED INCORRECTLY!
 *
 * @param value A string that will be stringified as-is.
 * @returns An object that will be stringified as the given string.
 */
export function $$$_this_can_allow_remote_code_execution_$$$(value: string): {} {
    const key = {};
    rawStrings.set(key, value);
    return key;
}

/**
 * Tries to stringify the given value as a JavaScript expression.
 *
 * @param value The value to stringify.
 * @returns A JavaScript expression that evaluates to the given value.
 */
function _stringify(stack: object[], value: unknown): string {
    if (value == null) {
        return `${value}`;
    }

    switch (typeof value) {
        case "boolean":
        case "function":
            return value.toString();

        case "bigint":
            return `${value}n`;

        case "string":
            return JSON.stringify(value);

        case "number": {
            if (Number.isNaN(value)) {
                return "NaN";
            } else if (value === Infinity) {
                return "Infinity";
            } else if (value === -Infinity) {
                return "-Infinity";
            } else {
                return value.toString();
            }
        }

        case "object": {
            if (rawStrings.has(value)) {
                return rawStrings.get(value)!;
            }

            if (stack.includes(value)) {
                return "undefined";
            } else {
                stack.push(value);
            }

            try {
                if (value instanceof RegExp) {
                    return value.toString();
                } else if (value instanceof Date) {
                    return `new Date(${_stringify(stack, value.toISOString())})`;
                } else if (value instanceof Map) {
                    return `new Map(${_stringify(stack, [...value])})`;
                } else if (value instanceof Set) {
                    return `new Set(${_stringify(stack, [...value])})`;
                } else if ("toJSON" in value && typeof value.toJSON === "function") {
                    return _stringify(stack, value.toJSON());
                } else if (Array.isArray(value)) {
                    return `[${value.map(_stringify.bind(null, stack)).join(", ")}]`;
                } else {
                    return `{ ${Object.entries(value)
                        .map(([k, v]) => `${isIdent(k) ? k : _stringify(stack, k)}: ${_stringify(stack, v)}`)
                        .join(", ")} }`;
                }
            } catch {
                return "undefined";
            } finally {
                stack.pop();
            }
        }

        default:
            return "undefined";
    }
}

/**
 * Tries to stringify the given value as a JavaScript expression.
 *
 * @param value The value to stringify.
 * @returns A JavaScript expression that evaluates to the given value.
 */
export function stringify(value: unknown): string {
    return _stringify([], value);
}

export default stringify;
