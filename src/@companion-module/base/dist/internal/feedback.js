"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackManager = void 0;
const tslib_1 = require("tslib");
const base_js_1 = require("./base.js");
// eslint-disable-next-line n/no-missing-import
const index_js_1 = tslib_1.__importDefault(require("../../lib/debounce-fn/index.js"));
function convertFeedbackInstanceToEvent(type, feedback) {
    return {
        type: type,
        id: feedback.id,
        feedbackId: feedback.feedbackId,
        controlId: feedback.controlId,
        options: feedback.options,
    };
}
class FeedbackManager {
    #parseVariablesInString;
    #updateFeedbackValues;
    #setFeedbackDefinitions;
    #log;
    #feedbackDefinitions = new Map();
    #feedbackInstances = new Map();
    // Feedback values waiting to be sent
    #pendingFeedbackValues = new Map();
    // Feedbacks currently being checked
    #feedbacksBeingChecked = new Map();
    // while in a context which provides an alternate parseVariablesInString, we should log when the original is called
    #parseVariablesContext;
    get parseVariablesContext() {
        return this.#parseVariablesContext;
    }
    constructor(parseVariablesInString, updateFeedbackValues, setFeedbackDefinitions, log) {
        this.#parseVariablesInString = parseVariablesInString;
        this.#updateFeedbackValues = updateFeedbackValues;
        this.#setFeedbackDefinitions = setFeedbackDefinitions;
        this.#log = log;
    }
    getDefinitionIds() {
        return Array.from(this.#feedbackDefinitions.keys());
    }
    getInstanceIds() {
        return Array.from(this.#feedbackInstances.keys());
    }
    handleUpdateFeedbacks(feedbacks) {
        for (const [id, feedback] of Object.entries(feedbacks)) {
            const existing = this.#feedbackInstances.get(id);
            if (existing) {
                // Call unsubscribe
                const definition = this.#feedbackDefinitions.get(existing.feedbackId);
                if (definition?.unsubscribe) {
                    const context = {
                        parseVariablesInString: async (text) => {
                            const res = await this.#parseVariablesInString({
                                text: text,
                                controlId: existing.controlId,
                                actionInstanceId: undefined,
                                feedbackInstanceId: existing.id,
                            });
                            return res.text;
                        },
                    };
                    Promise.resolve(definition.unsubscribe(convertFeedbackInstanceToEvent(definition.type, existing), context)).catch((e) => {
                        this.#log('error', `Feedback unsubscribe failed: ${JSON.stringify(existing)} - ${e?.message ?? e} ${e?.stack}`);
                    });
                }
            }
            if (!feedback || feedback.disabled) {
                // Deleted
                this.#feedbackInstances.delete(id);
            }
            else {
                // TODO module-lib - deep freeze the feedback to avoid mutation?
                this.#feedbackInstances.set(id, {
                    ...feedback,
                    referencedVariables: null,
                });
                // Inserted or updated
                const definition = this.#feedbackDefinitions.get(feedback.feedbackId);
                if (definition?.subscribe) {
                    const context = {
                        parseVariablesInString: async (text) => {
                            const res = await this.#parseVariablesInString({
                                text: text,
                                controlId: feedback.controlId,
                                actionInstanceId: undefined,
                                feedbackInstanceId: feedback.id,
                            });
                            return res.text;
                        },
                    };
                    Promise.resolve(definition.subscribe(convertFeedbackInstanceToEvent(definition.type, feedback), context)).catch((e) => {
                        this.#log('error', `Feedback subscribe failed: ${JSON.stringify(feedback)} - ${e?.message ?? e} ${e?.stack}`);
                    });
                }
                // update the feedback value
                this.#triggerCheckFeedback(id);
            }
        }
    }
    async handleLearnFeedback(msg) {
        const definition = this.#feedbackDefinitions.get(msg.feedback.feedbackId);
        if (definition && definition.learn) {
            const context = {
                parseVariablesInString: async (text) => {
                    const res = await this.#parseVariablesInString({
                        text: text,
                        controlId: msg.feedback.controlId,
                        actionInstanceId: undefined,
                        feedbackInstanceId: msg.feedback.id,
                    });
                    return res.text;
                },
            };
            const newOptions = await definition.learn({
                id: msg.feedback.id,
                feedbackId: msg.feedback.feedbackId,
                controlId: msg.feedback.controlId,
                options: msg.feedback.options,
                type: definition.type,
            }, context);
            return {
                options: newOptions,
            };
        }
        else {
            // Not supported
            return {
                options: undefined,
            };
        }
    }
    handleVariablesChanged(msg) {
        if (!msg.variablesIds.length)
            return;
        const changedFeedbackIds = new Set(msg.variablesIds);
        // Any feedbacks being checked should be made aware
        for (const feedbackStatus of this.#feedbacksBeingChecked.values()) {
            for (const id of msg.variablesIds) {
                feedbackStatus.changedVariables.add(id);
            }
        }
        // Determine the feedbacks that need checking
        const feedbackIds = new Set();
        for (const feedback of this.#feedbackInstances.values()) {
            // if feedback is currently being checked, it will be handled differently
            if (this.#feedbacksBeingChecked.has(feedback.id))
                continue;
            if (feedback.referencedVariables) {
                for (const id of feedback.referencedVariables) {
                    if (changedFeedbackIds.has(id)) {
                        feedbackIds.add(feedback.id);
                        break;
                    }
                }
            }
        }
        // Trigger all the feedbacks to be rechecked
        for (const id of feedbackIds) {
            setImmediate(() => {
                this.#triggerCheckFeedback(id);
            });
        }
    }
    #triggerCheckFeedback(id) {
        const existingRecheck = this.#feedbacksBeingChecked.get(id);
        if (existingRecheck) {
            // Already being checked
            existingRecheck.needsRecheck = true;
            return;
        }
        const feedback0 = this.#feedbackInstances.get(id);
        if (!feedback0)
            return;
        const feedback = feedback0;
        const feedbackCheckStatus = {
            needsRecheck: false,
            changedVariables: new Set(),
        };
        // mark it as being checked
        this.#feedbacksBeingChecked.set(id, feedbackCheckStatus);
        Promise.resolve()
            .then(async () => {
            const definition = this.#feedbackDefinitions.get(feedback.feedbackId);
            let value;
            const newReferencedVariables = new Set();
            // Calculate the new value for the feedback
            if (definition) {
                // Set this while the promise starts executing
                this.#parseVariablesContext = `Feedback ${feedback.feedbackId} (${id})`;
                const context = {
                    parseVariablesInString: async (text) => {
                        const res = await this.#parseVariablesInString({
                            text: text,
                            controlId: feedback.controlId,
                            actionInstanceId: undefined,
                            feedbackInstanceId: id,
                        });
                        // Track which variables were referenced
                        if (res.variableIds && res.variableIds.length) {
                            for (const id of res.variableIds) {
                                newReferencedVariables.add(id);
                            }
                        }
                        return res.text;
                    },
                };
                if (definition.type === 'boolean') {
                    value = definition.callback({
                        ...convertFeedbackInstanceToEvent('boolean', feedback),
                        type: 'boolean',
                    }, context);
                }
                else {
                    value = definition.callback({
                        ...convertFeedbackInstanceToEvent('advanced', feedback),
                        type: 'advanced',
                        image: feedback.image,
                    }, context);
                }
                this.#parseVariablesContext = undefined;
            }
            // Await the value before looking at this.#pendingFeedbackValues, to avoid race conditions
            const resolvedValue = await value;
            this.#pendingFeedbackValues.set(id, {
                id: id,
                controlId: feedback.controlId,
                value: resolvedValue,
            });
            this.#sendFeedbackValues();
            feedback.referencedVariables = newReferencedVariables.size > 0 ? Array.from(newReferencedVariables) : null;
        })
            .catch((e) => {
            console.error(`Feedback check failed: ${JSON.stringify(feedback)} - ${e?.message ?? e} ${e?.stack}`);
        })
            .finally(() => {
            // ensure this.#parseVariablesContext is cleared
            this.#parseVariablesContext = undefined;
            // it is no longer being checked
            this.#feedbacksBeingChecked.delete(id);
            // Check if any variables changed that should cause an immediate recheck
            let recheckForVariableChanged = false;
            if (feedback.referencedVariables) {
                for (const id of feedback.referencedVariables) {
                    if (feedbackCheckStatus.changedVariables.has(id)) {
                        recheckForVariableChanged = true;
                        break;
                    }
                }
            }
            // If queued, trigger a check
            if (recheckForVariableChanged || feedbackCheckStatus.needsRecheck) {
                setImmediate(() => {
                    this.#triggerCheckFeedback(id);
                });
            }
        });
    }
    /**
     * Send pending feedback values (from this.#pendingFeedbackValues) to companion, with a debounce
     */
    #sendFeedbackValues = (0, index_js_1.default)(() => {
        const newValues = this.#pendingFeedbackValues;
        this.#pendingFeedbackValues = new Map();
        // Send the new values back
        if (newValues.size > 0) {
            this.#updateFeedbackValues({
                values: Array.from(newValues.values()),
            });
        }
    }, {
        wait: 5,
        maxWait: 25,
    });
    setFeedbackDefinitions(feedbacks) {
        const hostFeedbacks = [];
        this.#feedbackDefinitions.clear();
        for (const [feedbackId, feedback] of Object.entries(feedbacks)) {
            if (feedback) {
                hostFeedbacks.push({
                    id: feedbackId,
                    name: feedback.name,
                    description: feedback.description,
                    options: (0, base_js_1.serializeIsVisibleFn)(feedback.options),
                    type: feedback.type,
                    defaultStyle: feedback.type === 'boolean' ? feedback.defaultStyle : undefined,
                    hasLearn: !!feedback.learn,
                    learnTimeout: feedback.learnTimeout,
                    showInvert: feedback.type === 'boolean' ? feedback.showInvert : false,
                });
                // Remember the definition locally
                this.#feedbackDefinitions.set(feedbackId, feedback);
            }
        }
        this.#setFeedbackDefinitions({ feedbacks: hostFeedbacks });
    }
    checkFeedbacks(feedbackTypes) {
        const types = new Set(feedbackTypes);
        for (const [id, feedback] of this.#feedbackInstances.entries()) {
            const definition = this.#feedbackDefinitions.get(feedback.feedbackId);
            if (definition) {
                if (types.size === 0 || types.has(feedback.feedbackId)) {
                    // update the feedback value
                    this.#triggerCheckFeedback(id);
                }
            }
        }
    }
    checkFeedbacksById(feedbackIds) {
        for (const id of feedbackIds) {
            // update the feedback value
            this.#triggerCheckFeedback(id);
        }
    }
    /** @deprecated */
    _getAllFeedbacks() {
        return Array.from(this.#feedbackInstances.values()).map((fb) => ({
            id: fb.id,
            feedbackId: fb.feedbackId,
            controlId: fb.controlId,
            options: fb.options,
        }));
    }
    subscribeFeedbacks(feedbackIds) {
        let feedbacks = Array.from(this.#feedbackInstances.values());
        const feedbackIdSet = new Set(feedbackIds);
        if (feedbackIdSet.size)
            feedbacks = feedbacks.filter((fb) => feedbackIdSet.has(fb.feedbackId));
        for (const fb of feedbacks) {
            const def = this.#feedbackDefinitions.get(fb.feedbackId);
            if (def?.subscribe) {
                const context = {
                    parseVariablesInString: async (text) => {
                        const res = await this.#parseVariablesInString({
                            text: text,
                            controlId: fb.controlId,
                            actionInstanceId: undefined,
                            feedbackInstanceId: fb.id,
                        });
                        return res.text;
                    },
                };
                Promise.resolve(def.subscribe(convertFeedbackInstanceToEvent(def.type, fb), context)).catch((e) => {
                    this.#log('error', `Feedback subscribe failed: ${JSON.stringify(fb)} - ${e?.message ?? e} ${e?.stack}`);
                });
            }
        }
    }
    unsubscribeFeedbacks(feedbackIds) {
        let feedbacks = Array.from(this.#feedbackInstances.values());
        const feedbackIdSet = new Set(feedbackIds);
        if (feedbackIdSet.size)
            feedbacks = feedbacks.filter((fb) => feedbackIdSet.has(fb.feedbackId));
        for (const fb of feedbacks) {
            const def = this.#feedbackDefinitions.get(fb.feedbackId);
            if (def && def.unsubscribe) {
                const context = {
                    parseVariablesInString: async (text) => {
                        const res = await this.#parseVariablesInString({
                            text: text,
                            controlId: fb.controlId,
                            actionInstanceId: undefined,
                            feedbackInstanceId: fb.id,
                        });
                        return res.text;
                    },
                };
                Promise.resolve(def.unsubscribe(convertFeedbackInstanceToEvent(def.type, fb), context)).catch((e) => {
                    this.#log('error', `Feedback unsubscribe failed: ${JSON.stringify(fb)} - ${e?.message ?? e} ${e?.stack}`);
                });
            }
        }
    }
}
exports.FeedbackManager = FeedbackManager;
//# sourceMappingURL=feedback.js.map