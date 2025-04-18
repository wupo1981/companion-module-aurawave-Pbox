"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionManager = void 0;
const base_js_1 = require("./base.js");
function convertActionInstanceToEvent(action) {
    return {
        id: action.id,
        actionId: action.actionId,
        controlId: action.controlId,
        options: action.options,
    };
}
class ActionManager {
    #parseVariablesInString;
    #setActionDefinitions;
    #log;
    #actionDefinitions = new Map();
    #actionInstances = new Map();
    constructor(parseVariablesInString, setActionDefinitions, log) {
        this.#parseVariablesInString = parseVariablesInString;
        this.#setActionDefinitions = setActionDefinitions;
        this.#log = log;
    }
    async handleExecuteAction(msg) {
        const actionDefinition = this.#actionDefinitions.get(msg.action.actionId);
        if (!actionDefinition)
            throw new Error(`Unknown action: ${msg.action.actionId}`);
        const context = {
            parseVariablesInString: async (text) => {
                const res = await this.#parseVariablesInString({
                    text: text,
                    controlId: msg.action.controlId,
                    actionInstanceId: msg.action.id,
                    feedbackInstanceId: undefined,
                });
                return res.text;
            },
        };
        await actionDefinition.callback({
            id: msg.action.id,
            actionId: msg.action.actionId,
            controlId: msg.action.controlId,
            options: msg.action.options,
            surfaceId: msg.surfaceId,
        }, context);
    }
    handleUpdateActions(actions) {
        for (const [id, action] of Object.entries(actions)) {
            const existing = this.#actionInstances.get(id);
            if (existing) {
                // Call unsubscribe
                const definition = this.#actionDefinitions.get(existing.actionId);
                if (definition?.unsubscribe) {
                    const context = {
                        parseVariablesInString: async (text) => {
                            const res = await this.#parseVariablesInString({
                                text: text,
                                controlId: existing.controlId,
                                actionInstanceId: existing.id,
                                feedbackInstanceId: undefined,
                            });
                            return res.text;
                        },
                    };
                    Promise.resolve(definition.unsubscribe(convertActionInstanceToEvent(existing), context)).catch((e) => {
                        this.#log('error', `Action unsubscribe failed: ${JSON.stringify(existing)} - ${e?.message ?? e} ${e?.stack}`);
                    });
                }
            }
            if (!action || action.disabled) {
                // Deleted
                this.#actionInstances.delete(id);
            }
            else {
                // TODO module-lib - deep freeze the action to avoid mutation?
                this.#actionInstances.set(id, action);
                // Inserted or updated
                const definition = this.#actionDefinitions.get(action.actionId);
                if (definition?.subscribe) {
                    const context = {
                        parseVariablesInString: async (text) => {
                            const res = await this.#parseVariablesInString({
                                text: text,
                                controlId: action.controlId,
                                actionInstanceId: action.id,
                                feedbackInstanceId: undefined,
                            });
                            return res.text;
                        },
                    };
                    Promise.resolve(definition.subscribe(convertActionInstanceToEvent(action), context)).catch((e) => {
                        this.#log('error', `Action subscribe failed: ${JSON.stringify(action)} - ${e?.message ?? e} ${e?.stack}`);
                    });
                }
            }
        }
    }
    async handleLearnAction(msg) {
        const definition = this.#actionDefinitions.get(msg.action.actionId);
        if (definition && definition.learn) {
            const context = {
                parseVariablesInString: async (text) => {
                    const res = await this.#parseVariablesInString({
                        text: text,
                        controlId: msg.action.controlId,
                        actionInstanceId: msg.action.id,
                        feedbackInstanceId: undefined,
                    });
                    return res.text;
                },
            };
            const newOptions = await definition.learn({
                id: msg.action.id,
                actionId: msg.action.actionId,
                controlId: msg.action.controlId,
                options: msg.action.options,
                surfaceId: undefined,
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
    setActionDefinitions(actions) {
        const hostActions = [];
        this.#actionDefinitions.clear();
        for (const [actionId, action] of Object.entries(actions)) {
            if (action) {
                hostActions.push({
                    id: actionId,
                    name: action.name,
                    description: action.description,
                    options: (0, base_js_1.serializeIsVisibleFn)(action.options),
                    hasLearn: !!action.learn,
                    learnTimeout: action.learnTimeout,
                });
                // Remember the definition locally
                this.#actionDefinitions.set(actionId, action);
            }
        }
        this.#setActionDefinitions({ actions: hostActions });
    }
    /** @deprecated */
    _getAllActions() {
        return Array.from(this.#actionInstances.values()).map((act) => ({
            id: act.id,
            actionId: act.actionId,
            controlId: act.controlId,
            options: act.options,
        }));
    }
    subscribeActions(actionIds) {
        let actions = Array.from(this.#actionInstances.values());
        const actionIdSet = new Set(actionIds);
        if (actionIdSet.size)
            actions = actions.filter((fb) => actionIdSet.has(fb.actionId));
        for (const act of actions) {
            const def = this.#actionDefinitions.get(act.actionId);
            if (def?.subscribe) {
                const context = {
                    parseVariablesInString: async (text) => {
                        const res = await this.#parseVariablesInString({
                            text: text,
                            controlId: act.controlId,
                            actionInstanceId: act.id,
                            feedbackInstanceId: undefined,
                        });
                        return res.text;
                    },
                };
                Promise.resolve(def.subscribe(convertActionInstanceToEvent(act), context)).catch((e) => {
                    this.#log('error', `Action subscribe failed: ${JSON.stringify(act)} - ${e?.message ?? e} ${e?.stack}`);
                });
            }
        }
    }
    unsubscribeActions(actionIds) {
        let actions = Array.from(this.#actionInstances.values());
        const actionIdSet = new Set(actionIds);
        if (actionIdSet.size)
            actions = actions.filter((fb) => actionIdSet.has(fb.actionId));
        for (const act of actions) {
            const def = this.#actionDefinitions.get(act.actionId);
            if (def && def.unsubscribe) {
                const context = {
                    parseVariablesInString: async (text) => {
                        const res = await this.#parseVariablesInString({
                            text: text,
                            controlId: act.controlId,
                            actionInstanceId: act.id,
                            feedbackInstanceId: undefined,
                        });
                        return res.text;
                    },
                };
                Promise.resolve(def.unsubscribe(convertActionInstanceToEvent(act), context)).catch((e) => {
                    this.#log('error', `Action unsubscribe failed: ${JSON.stringify(act)} - ${e?.message ?? e} ${e?.stack}`);
                });
            }
        }
    }
}
exports.ActionManager = ActionManager;
//# sourceMappingURL=actions.js.map