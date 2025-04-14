"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateManifest = validateManifest;
const tslib_1 = require("tslib");
// @ts-expect-error no typings
// eslint-disable-next-line n/no-missing-import
const validate_manifest_js_1 = tslib_1.__importDefault(require("../generated/validate_manifest.js"));
/** Validate that a manifest looks correctly populated */
function validateManifest(manifest) {
    const manifestStr = JSON.stringify(manifest);
    if (manifestStr.includes('companion-module-your-module-name'))
        throw new Error(`Manifest incorrectly references template module 'companion-module-your-module-name'`);
    if (manifestStr.includes('module-shortname'))
        throw new Error(`Manifest incorrectly references template module 'module-shortname'`);
    if (manifestStr.includes('A short one line description of your module'))
        throw new Error(`Manifest incorrectly references template module 'A short one line description of your module'`);
    if (manifestStr.includes('Your name'))
        throw new Error(`Manifest incorrectly references template module 'Your name'`);
    if (manifestStr.includes('Your email'))
        throw new Error(`Manifest incorrectly references template module 'Your email'`);
    if (manifestStr.includes('Your company'))
        throw new Error(`Manifest incorrectly references template module 'Your company'`);
    if (manifestStr.includes('Your product'))
        throw new Error(`Manifest incorrectly references template module 'Your product'`);
    if (!(0, validate_manifest_js_1.default)(manifest)) {
        const errors = validate_manifest_js_1.default.errors;
        if (!errors)
            throw new Error(`Manifest failed validation with unknown reason`);
        throw new Error(`Manifest validation failed: ${JSON.stringify(errors)}`);
    }
}
//# sourceMappingURL=manifest.js.map