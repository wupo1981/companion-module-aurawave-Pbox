"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyUpgradeScript = void 0;
exports.CreateConvertToBooleanFeedbackUpgradeScript = CreateConvertToBooleanFeedbackUpgradeScript;
exports.CreateUseBuiltinInvertForFeedbacksUpgradeScript = CreateUseBuiltinInvertForFeedbacksUpgradeScript;
/**
 * A helper upgrade script, which does nothing.
 * Useful to replace a script which is no longer needed
 */
const EmptyUpgradeScript = () => ({
    updatedConfig: null,
    updatedActions: [],
    updatedFeedbacks: [],
});
exports.EmptyUpgradeScript = EmptyUpgradeScript;
/**
 * A helper script to automate the bulk of the process to upgrade feedbacks from 'advanced' to 'boolean'.
 * There are some built-in rules for properties names based on the most common cases.
 * @param upgradeMap The feedbacks to upgrade and the properties to convert
 */
function CreateConvertToBooleanFeedbackUpgradeScript(upgradeMap) {
    // Warning: the unused parameters will often be null
    return (_context, props) => {
        const changedFeedbacks = [];
        for (const feedback of props.feedbacks) {
            let upgrade_rules = upgradeMap[feedback.feedbackId];
            if (upgrade_rules === true) {
                // These are some automated built in rules. They can help make it easier to migrate
                upgrade_rules = {
                    bg: 'bgcolor',
                    bgcolor: 'bgcolor',
                    fg: 'color',
                    color: 'color',
                    png64: 'png64',
                    png: 'png64',
                };
            }
            if (upgrade_rules) {
                if (!feedback.style)
                    feedback.style = {};
                for (const [option_key, style_key] of Object.entries(upgrade_rules)) {
                    if (feedback.options[option_key] !== undefined) {
                        feedback.style[style_key] = feedback.options[option_key];
                        delete feedback.options[option_key];
                        changedFeedbacks.push(feedback);
                    }
                }
            }
        }
        return {
            updatedConfig: null,
            updatedActions: [],
            updatedFeedbacks: changedFeedbacks,
        };
    };
}
/**
 * A helper script to automate the bulk of the process to upgrade feedbacks from having a module defined 'invert' field, to use the builtin one.
 * The feedback definitions must be updated manually, this can only help update existing usages of the feedback.
 * @param upgradeMap The feedbacks to upgrade and the id of the option to convert
 */
function CreateUseBuiltinInvertForFeedbacksUpgradeScript(upgradeMap) {
    // Warning: the unused parameters will often be null
    return (_context, props) => {
        const changedFeedbacks = [];
        for (const feedback of props.feedbacks) {
            const propertyName = upgradeMap[feedback.feedbackId];
            if (typeof propertyName !== 'string')
                continue;
            // Retrieve and delete the old value
            const rawValue = feedback.options[propertyName];
            if (rawValue === undefined)
                continue;
            delete feedback.options[propertyName];
            // Interpret it to a boolean, it could be stored in a few ways
            feedback.isInverted = rawValue === 'true' || rawValue === true || Number(rawValue) > 0;
            changedFeedbacks.push(feedback);
        }
        return {
            updatedConfig: null,
            updatedActions: [],
            updatedFeedbacks: changedFeedbacks,
        };
    };
}
//# sourceMappingURL=upgrade.js.map