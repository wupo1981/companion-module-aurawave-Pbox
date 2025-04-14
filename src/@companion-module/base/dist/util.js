"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.literal = literal;
exports.assertNever = assertNever;
exports.combineRgb = combineRgb;
exports.splitRgb = splitRgb;
exports.splitHsl = splitHsl;
exports.splitHsv = splitHsv;
exports.splitHex = splitHex;
const colord_1 = require("colord");
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
function literal(v) {
    return v;
}
/** Type assert that a value is never */
function assertNever(_val) {
    // Nothing to do
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
function combineRgb(r, g, b, a) {
    let colorNumber = ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
    if (a && a >= 0 && a < 1) {
        colorNumber += 0x1000000 * Math.round(255 * (1 - a)); // add possible transparency to number
    }
    return colorNumber;
}
/**
 * Split a combined color value to separate RGBA component values
 * the color can be either the Companion color number or a CSS compatible color string
 * return object will always include an alpha value (0.0-1.0), defaulting to 1 if input has no alpha information
 */
function splitRgb(color) {
    if (typeof color === 'number') {
        if (color > 0xffffff) {
            return {
                r: (color >> 16) & 0xff,
                g: (color >> 8) & 0xff,
                b: color & 0xff,
                a: (255 - ((color >> 24) & 0xff)) / 255,
            };
        }
        else {
            return {
                r: (color >> 16) & 0xff,
                g: (color >> 8) & 0xff,
                b: color & 0xff,
                a: 1,
            };
        }
    }
    else if (typeof color === 'string' && (0, colord_1.colord)(color).isValid()) {
        const rgb = (0, colord_1.colord)(color).toRgb();
        return {
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            a: rgb.a,
        };
    }
    else {
        return {
            r: 0,
            g: 0,
            b: 0,
            a: 1,
        };
    }
}
/**
 * Split a combined color value to separate HSLA component values
 * the color can be either the Companion color number or a CSS compatible color string
 * return object will always include an alpha value (0.0-1.0), defaulting to 1 if input has no alpha information
 */
function splitHsl(color) {
    const rgb = splitRgb(color);
    const hsl = (0, colord_1.colord)(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`).toHsl();
    return hsl;
}
/**
 * Split a combined color value to separate HSVA component values
 * the color can be either the Companion color number or a CSS compatible color string
 * return object will always include an alpha value (0.0-1.0), defaulting to 1 if input has no alpha information
 */
function splitHsv(color) {
    const rgb = splitRgb(color);
    const hsv = (0, colord_1.colord)(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`).toHsv();
    return hsv;
}
/**
 * Takes a color value and returns a string with Hex notation of that color
 * the color can be either the Companion color number or a CSS compatible color string
 * if input color has no alpha or alpha of 1, return will be in format '#rrggbb', else '#rrggbbaa'
 */
function splitHex(color) {
    const rgb = splitRgb(color);
    const hex = (0, colord_1.colord)(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`).toHex();
    return hex;
}
//# sourceMappingURL=util.js.map