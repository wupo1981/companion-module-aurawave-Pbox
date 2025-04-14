import { HslaColor, HsvaColor } from 'colord';
/**
 * Assert a certain type for a literal.
 * This can be used to correctly type parts of an object in TypeScript.
 *
 * ### Example
 *  ```ts
 * {
 *  [ActionId.MyAction]: literal<CompanionActionDefinition>({
 *   name: 'My Action',
 *   // ...
 *  })
 * }
 * ```
 *
 * instead of this
 * ```ts
 * {
 *  [ActionId.MyAction]: {
 *   name: 'My Action',
 *   // ...
 *  }
 * }
 * ```
 */
export declare function literal<T>(v: T): T;
/** Type assert that a value is never */
export declare function assertNever(_val: never): void;
export interface RgbComponents {
    r: number;
    g: number;
    b: number;
    a?: number;
}
/**
 * Combine separate RGB component to one single numerical value.
 * The RGB component have to be in a range of 0-255.
 * There can also be an alpha component in a range of 0.0-1.0 (0 = transparent).
 *
 * **Note:** Companion's components can use any CSS color string and you should prefer these strings. E.g.for a button style you can also use `'#ff8800'` or `'rgb(255, 128, 0)'` without calling a function.
 *
 * ### Example
 *
 * ```js
 * defaultStyle: {
 *  bgcolor: combineRgb(255, 0, 0),
 *  color: combineRgb(255, 255, 255),
 * }
 * ```
 */
export declare function combineRgb(r: number, g: number, b: number, a?: number): number;
/**
 * Split a combined color value to separate RGBA component values
 * the color can be either the Companion color number or a CSS compatible color string
 * return object will always include an alpha value (0.0-1.0), defaulting to 1 if input has no alpha information
 */
export declare function splitRgb(color: number | string): RgbComponents;
/**
 * Split a combined color value to separate HSLA component values
 * the color can be either the Companion color number or a CSS compatible color string
 * return object will always include an alpha value (0.0-1.0), defaulting to 1 if input has no alpha information
 */
export declare function splitHsl(color: number | string): HslaColor;
/**
 * Split a combined color value to separate HSVA component values
 * the color can be either the Companion color number or a CSS compatible color string
 * return object will always include an alpha value (0.0-1.0), defaulting to 1 if input has no alpha information
 */
export declare function splitHsv(color: number | string): HsvaColor;
/**
 * Takes a color value and returns a string with Hex notation of that color
 * the color can be either the Companion color number or a CSS compatible color string
 * if input color has no alpha or alpha of 1, return will be in format '#rrggbb', else '#rrggbbaa'
 */
export declare function splitHex(color: number | string): string;
/**
 * Make all optional properties be required and `| undefined`
 * This is useful to ensure that no property is missed, when manually converting between types, but allowing fields to be undefined
 */
export type Complete<T> = {
    [P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : T[P] | undefined;
};
//# sourceMappingURL=util.d.ts.map