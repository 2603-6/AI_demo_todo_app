/**
 * Exhaustiveness guard for discriminated unions and switch statements.
 *
 * Use this in a `default` branch to force compile-time checking that all
 * possible cases were handled. If a new union member is added and not handled,
 * TypeScript will fail at compile time where this function is called.
 */
export function exhaustiveGuard(value: never, context = 'Unhandled case'): never {
  throw new Error(`${context}: ${String(value)}`);
}
