"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceBase = void 0;
const tslib_1 = require("tslib");
const util_js_1 = require("../util.js");
const p_queue_1 = tslib_1.__importDefault(require("p-queue"));
const base_js_1 = require("../internal/base.js");
const upgrade_js_1 = require("../internal/upgrade.js");
const feedback_js_1 = require("../internal/feedback.js");
const ipc_wrapper_js_1 = require("../host-api/ipc-wrapper.js");
const actions_js_1 = require("../internal/actions.js");
const shared_udp_socket_js_1 = require("./shared-udp-socket.js");
class InstanceBase {
    #ipcWrapper;
    #upgradeScripts;
    id;
    #lifecycleQueue = new p_queue_1.default({ concurrency: 1 });
    #initialized = false;
    #recordingActions = false;
    #lastConfig = {};
    #actionManager;
    #feedbackManager;
    #sharedUdpSocketHandlers = new Map();
    #variableDefinitions = new Map();
    #variableValues = new Map();
    #options;
    #label;
    get instanceOptions() {
        return this.#options;
    }
    /**
     * The user chosen name for this instance.
     * This can be changed just before `configUpdated` is called
     */
    get label() {
        return this.#label;
    }
    /**
     * Create an instance of the module
     */
    constructor(internal) {
        if (!(0, base_js_1.isInstanceBaseProps)(internal) || !internal._isInstanceBaseProps)
            throw new Error(`Module instance is being constructed incorrectly. Make sure you aren't trying to do this manually`);
        this.createSharedUdpSocket = this.createSharedUdpSocket.bind(this);
        this.#options = {
            disableVariableValidation: false,
        };
        this.#ipcWrapper = new ipc_wrapper_js_1.IpcWrapper({
            init: this._handleInit.bind(this),
            destroy: this._handleDestroy.bind(this),
            updateConfigAndLabel: this._handleConfigUpdateAndLabel.bind(this),
            updateConfig: async () => undefined, // Replaced by updateConfigAndLabel
            executeAction: this._handleExecuteAction.bind(this),
            updateFeedbacks: this._handleUpdateFeedbacks.bind(this),
            updateActions: this._handleUpdateActions.bind(this),
            getConfigFields: this._handleGetConfigFields.bind(this),
            handleHttpRequest: this._handleHttpRequest.bind(this),
            learnAction: this._handleLearnAction.bind(this),
            learnFeedback: this._handleLearnFeedback.bind(this),
            startStopRecordActions: this._handleStartStopRecordActions.bind(this),
            variablesChanged: this._handleVariablesChanged.bind(this),
            sharedUdpSocketMessage: this._handleSharedUdpSocketMessage.bind(this),
            sharedUdpSocketError: this._handleSharedUdpSocketError.bind(this),
        }, (msg) => {
            process.send(msg);
        }, 5000);
        process.on('message', (msg) => {
            this.#ipcWrapper.receivedMessage(msg);
        });
        this.#actionManager = new actions_js_1.ActionManager(async (msg) => this.#ipcWrapper.sendWithCb('parseVariablesInString', msg), (msg) => this.#ipcWrapper.sendWithNoCb('setActionDefinitions', msg), this.log.bind(this));
        this.#feedbackManager = new feedback_js_1.FeedbackManager(async (msg) => this.#ipcWrapper.sendWithCb('parseVariablesInString', msg), (msg) => this.#ipcWrapper.sendWithNoCb('updateFeedbackValues', msg), (msg) => this.#ipcWrapper.sendWithNoCb('setFeedbackDefinitions', msg), this.log.bind(this));
        this.#upgradeScripts = internal.upgradeScripts;
        this.id = internal.id;
        this.#label = internal.id; // Temporary
        this.log('debug', 'Initializing');
    }
    async _handleInit(msg) {
        return this.#lifecycleQueue.add(async () => {
            if (this.#initialized)
                throw new Error('Already initialized');
            const actions = msg.actions;
            const feedbacks = msg.feedbacks;
            this.#lastConfig = msg.config;
            this.#label = msg.label;
            // Create initial config object
            if (msg.isFirstInit) {
                const newConfig = {};
                const fields = this.getConfigFields();
                for (const field of fields) {
                    if ('default' in field) {
                        newConfig[field.id] = field.default;
                    }
                }
                this.#lastConfig = newConfig;
                this.saveConfig(this.#lastConfig);
                // this is new, so there is no point attempting to run any upgrade scripts
                msg.lastUpgradeIndex = this.#upgradeScripts.length - 1;
            }
            /**
             * Performing upgrades during init requires a fair chunk of work.
             * Some actions/feedbacks will be using the upgradeIndex of the instance, but some may have their own upgradeIndex on themselves if they are from an import.
             */
            const { updatedActions, updatedFeedbacks, updatedConfig } = (0, upgrade_js_1.runThroughUpgradeScripts)(actions, feedbacks, msg.lastUpgradeIndex, this.#upgradeScripts, this.#lastConfig, false);
            this.#lastConfig = updatedConfig ?? this.#lastConfig;
            // Send the upgraded data back to companion now. Just so that if the init crashes, this doesnt have to be repeated
            const pSendUpgrade = this.#ipcWrapper.sendWithCb('upgradedItems', {
                updatedActions,
                updatedFeedbacks,
            });
            // Now we can initialise the module
            try {
                await this.init(this.#lastConfig, !!msg.isFirstInit);
                this.#initialized = true;
            }
            catch (e) {
                console.trace(`Init failed: ${e}`);
                throw e;
            }
            finally {
                // Only now do we need to await the upgrade
                await pSendUpgrade;
            }
            setImmediate(() => {
                // Subscribe all of the actions and feedbacks
                this._handleUpdateActions({ actions }, true).catch((e) => {
                    this.log('error', `Receive actions failed: ${e}`);
                });
                this._handleUpdateFeedbacks({ feedbacks }, true).catch((e) => {
                    this.log('error', `Receive feedbacks failed: ${e}`);
                });
            });
            return {
                hasHttpHandler: typeof this.handleHttpRequest === 'function',
                hasRecordActionsHandler: typeof this.handleStartStopRecordActions == 'function',
                newUpgradeIndex: this.#upgradeScripts.length - 1,
                updatedConfig: this.#lastConfig,
            };
        });
    }
    async _handleDestroy() {
        await this.#lifecycleQueue.add(async () => {
            if (!this.#initialized)
                throw new Error('Not initialized');
            await this.destroy();
            this.#initialized = false;
        });
    }
    async _handleConfigUpdateAndLabel(msg) {
        await this.#lifecycleQueue.add(async () => {
            if (!this.#initialized)
                throw new Error('Not initialized');
            this.#label = msg.label;
            this.#lastConfig = msg.config;
            await this.configUpdated(this.#lastConfig);
        });
    }
    async _handleExecuteAction(msg) {
        return this.#actionManager.handleExecuteAction(msg);
    }
    async _handleUpdateFeedbacks(msg, skipUpgrades) {
        // Run through upgrade scripts if needed
        if (!skipUpgrades) {
            const res = (0, upgrade_js_1.runThroughUpgradeScripts)({}, msg.feedbacks, null, this.#upgradeScripts, this.#lastConfig, true);
            this.#ipcWrapper
                .sendWithCb('upgradedItems', {
                updatedActions: res.updatedActions,
                updatedFeedbacks: res.updatedFeedbacks,
            })
                .catch((e) => {
                this.log('error', `Failed to save upgraded feedbacks: ${e}`);
            });
        }
        this.#feedbackManager.handleUpdateFeedbacks(msg.feedbacks);
    }
    async _handleUpdateActions(msg, skipUpgrades) {
        // Run through upgrade scripts if needed
        if (!skipUpgrades) {
            const res = (0, upgrade_js_1.runThroughUpgradeScripts)(msg.actions, {}, null, this.#upgradeScripts, this.#lastConfig, true);
            this.#ipcWrapper
                .sendWithCb('upgradedItems', {
                updatedActions: res.updatedActions,
                updatedFeedbacks: res.updatedFeedbacks,
            })
                .catch((e) => {
                this.log('error', `Failed to save upgraded actions: ${e}`);
            });
        }
        this.#actionManager.handleUpdateActions(msg.actions);
    }
    async _handleGetConfigFields(_msg) {
        return {
            fields: (0, base_js_1.serializeIsVisibleFn)(this.getConfigFields()),
        };
    }
    async _handleHttpRequest(msg) {
        if (!this.handleHttpRequest)
            throw new Error(`handleHttpRequest is not supported!`);
        const res = await this.handleHttpRequest(msg.request);
        return { response: res };
    }
    async _handleLearnAction(msg) {
        return this.#actionManager.handleLearnAction(msg);
    }
    async _handleLearnFeedback(msg) {
        return this.#feedbackManager.handleLearnFeedback(msg);
    }
    async _handleStartStopRecordActions(msg) {
        if (!msg.recording) {
            if (!this.#recordingActions) {
                // Already stopped
                return;
            }
        }
        else {
            if (this.#recordingActions) {
                // Already running
                return;
            }
        }
        if (!this.handleStartStopRecordActions) {
            this.#recordingActions = false;
            throw new Error('Recording actions is not supported by this module!');
        }
        this.#recordingActions = msg.recording;
        this.handleStartStopRecordActions(this.#recordingActions);
    }
    async _handleVariablesChanged(msg) {
        this.#feedbackManager.handleVariablesChanged(msg);
    }
    async _handleSharedUdpSocketMessage(msg) {
        for (const socket of this.#sharedUdpSocketHandlers.values()) {
            if (socket.handleId === msg.handleId) {
                socket.receiveSocketMessage(msg);
            }
        }
    }
    async _handleSharedUdpSocketError(msg) {
        for (const socket of this.#sharedUdpSocketHandlers.values()) {
            if (socket.handleId === msg.handleId) {
                socket.receiveSocketError(msg.error);
            }
        }
    }
    /**
     * Save an updated configuration object
     * @param newConfig The new config object
     */
    saveConfig(newConfig) {
        this.#lastConfig = newConfig;
        this.#ipcWrapper.sendWithNoCb('saveConfig', { config: newConfig });
    }
    /**
     * Set the action definitions for this instance
     * @param actions The action definitions
     */
    setActionDefinitions(actions) {
        this.#actionManager.setActionDefinitions(actions);
    }
    /**
     * Set the feedback definitions for this instance
     * @param feedbacks The feedback definitions
     */
    setFeedbackDefinitions(feedbacks) {
        this.#feedbackManager.setFeedbackDefinitions(feedbacks);
    }
    /**
     * Set the peset definitions for this instance
     * @param presets The preset definitions
     */
    setPresetDefinitions(presets) {
        const hostPresets = [];
        for (const [id, preset] of Object.entries(presets)) {
            if (preset) {
                hostPresets.push({
                    ...preset,
                    id,
                });
            }
        }
        this.#ipcWrapper.sendWithNoCb('setPresetDefinitions', { presets: hostPresets });
    }
    /**
     * Set the variable definitions for this instance
     * @param variables The variable definitions
     */
    setVariableDefinitions(variables) {
        const hostVariables = [];
        const hostValues = [];
        this.#variableDefinitions.clear();
        for (const variable of variables) {
            hostVariables.push({
                id: variable.variableId,
                name: variable.name,
            });
            // Remember the definition locally
            this.#variableDefinitions.set(variable.variableId, variable);
            if (!this.#variableValues.has(variable.variableId)) {
                // Give us a local cached value of something
                this.#variableValues.set(variable.variableId, '');
                hostValues.push({
                    id: variable.variableId,
                    value: '',
                });
            }
        }
        if (!this.#options.disableVariableValidation) {
            const validIds = new Set(this.#variableDefinitions.keys());
            for (const id of this.#variableValues.keys()) {
                if (!validIds.has(id)) {
                    // Delete any local cached value
                    this.#variableValues.delete(id);
                    hostValues.push({
                        id: id,
                        value: undefined,
                    });
                }
            }
        }
        this.#ipcWrapper.sendWithNoCb('setVariableDefinitions', { variables: hostVariables, newValues: hostValues });
    }
    /**
     * Set the values of some variables
     * @param values The new values for the variables
     */
    setVariableValues(values) {
        const hostValues = [];
        for (const [variableId, value] of Object.entries(values)) {
            if (this.#options.disableVariableValidation) {
                // update the cached value
                if (value === undefined) {
                    this.#variableValues.delete(variableId);
                }
                else {
                    this.#variableValues.set(variableId, value);
                }
                hostValues.push({
                    id: variableId,
                    value: value,
                });
            }
            else if (this.#variableDefinitions.has(variableId)) {
                // update the cached value
                this.#variableValues.set(variableId, value ?? '');
                hostValues.push({
                    id: variableId,
                    value: value ?? '',
                });
            }
            else {
                // tell companion to delete the value
                hostValues.push({
                    id: variableId,
                    value: undefined,
                });
            }
        }
        this.#ipcWrapper.sendWithNoCb('setVariableValues', { newValues: hostValues });
    }
    /**
     * Get the last set value of a variable from this connection
     * @param variableId id of the variable
     * @returns The value
     */
    getVariableValue(variableId) {
        return this.#variableValues.get(variableId);
    }
    /**
     * Parse and replace all the variables in a string
     * Note: You must not use this for feedbacks, as your feedback will not update when the variable changes.
     * There is an alternate version of this supplied to each of the action/feedback callbacks that tracks
     * usages properly and will retrigger the feedback when the variables change.
     * @param text The text to parse
     * @returns The string with variables replaced with their values
     */
    async parseVariablesInString(text) {
        const currentContext = this.#feedbackManager.parseVariablesContext;
        if (currentContext) {
            this.log('debug', `parseVariablesInString called while in: ${currentContext}. You should use the parseVariablesInString provided to the callback instead`);
        }
        const res = await this.#ipcWrapper.sendWithCb('parseVariablesInString', {
            text: text,
            controlId: undefined,
            actionInstanceId: undefined,
            feedbackInstanceId: undefined,
        });
        return res.text;
    }
    /**
     * Request all feedbacks of the specified types to be checked for changes
     * @param feedbackTypes The feedback types to check
     */
    checkFeedbacks(...feedbackTypes) {
        this.#feedbackManager.checkFeedbacks(feedbackTypes);
    }
    /**
     * Request the specified feedback instances to be checked for changes
     * @param feedbackIds The ids of the feedback instances to check
     */
    checkFeedbacksById(...feedbackIds) {
        this.#feedbackManager.checkFeedbacksById(feedbackIds);
    }
    /** @deprecated */
    _getAllActions() {
        return this.#actionManager._getAllActions();
    }
    /**
     * Call subscribe on all currently known placed actions.
     * It can be useful to trigger this upon establishing a connection, to ensure all data is loaded.
     * @param actionIds The actionIds to call subscribe for. If no values are provided, then all are called.
     */
    subscribeActions(...actionIds) {
        this.#actionManager.subscribeActions(actionIds);
    }
    /**
     * Call unsubscribe on all currently known placed actions.
     * It can be useful to do some cleanup upon a connection closing.
     * @param actionIds The actionIds to call subscribe for. If no values are provided, then all are called.
     */
    unsubscribeActions(...actionIds) {
        this.#actionManager.unsubscribeActions(actionIds);
    }
    /** @deprecated */
    _getAllFeedbacks() {
        return this.#feedbackManager._getAllFeedbacks();
    }
    /**
     * Call subscribe on all currently known placed feedbacks.
     * It can be useful to trigger this upon establishing a connection, to ensure all data is loaded.
     * @param feedbackIds The feedbackIds to call subscribe for. If no values are provided, then all are called.
     */
    subscribeFeedbacks(...feedbackIds) {
        this.#feedbackManager.subscribeFeedbacks(feedbackIds);
    }
    /**
     * Call unsubscribe on all currently known placed feedbacks.
     * It can be useful to do some cleanup upon a connection closing.
     * @param feedbackIds The feedbackIds to call subscribe for. If no values are provided, then all are called.
     */
    unsubscribeFeedbacks(...feedbackIds) {
        this.#feedbackManager.unsubscribeFeedbacks(feedbackIds);
    }
    /**
     * Add an action to the current recording session
     * @param action The action to be added to the recording session
     * @param uniquenessId A unique id for the action being recorded. This should be different for each action, but by passing the same as a previous call will replace the previous value.
     */
    recordAction(action, uniquenessId) {
        if (!this.#recordingActions)
            throw new Error('Not currently recording actions');
        this.#ipcWrapper.sendWithNoCb('recordAction', {
            uniquenessId: uniquenessId ?? null,
            actionId: action.actionId,
            options: action.options,
            delay: action.delay,
        });
    }
    /**
     * @deprecated Experimental: This method may change without notice. Do not use!
     * Set the value of a custom variable
     * @param variableName
     * @param value
     * @returns Promise which resolves upon success, or rejects if the variable no longer exists
     */
    setCustomVariableValue(variableName, value) {
        this.#ipcWrapper.sendWithNoCb('setCustomVariable', {
            customVariableId: variableName,
            value,
        });
    }
    /**
     * Send an osc message from the system osc sender
     * @param host destination ip address
     * @param port destination port number
     * @param path message path
     * @param args mesage arguments
     */
    oscSend(host, port, path, args) {
        this.#ipcWrapper.sendWithNoCb('send-osc', (0, util_js_1.literal)({
            host,
            port,
            path,
            args,
        }));
    }
    /**
     * Update the status of this connection
     * @param status The status level
     * @param message Additional information about the status
     *
     * ### Example
     * ```js
     * this.updateStatus(InstanceStatus.Ok)
     * ```
     */
    updateStatus(status, message) {
        this.#ipcWrapper.sendWithNoCb('set-status', (0, util_js_1.literal)({
            status,
            message: message ?? null,
        }));
    }
    /**
     * Write a line to the log
     * @param level The level of the message
     * @param message The message text to write
     */
    log(level, message) {
        this.#ipcWrapper.sendWithNoCb('log-message', (0, util_js_1.literal)({
            level,
            message,
        }));
    }
    createSharedUdpSocket(typeOrOptions, callback) {
        const options = typeof typeOrOptions === 'string' ? { type: typeOrOptions } : typeOrOptions;
        const socket = new shared_udp_socket_js_1.SharedUdpSocketImpl(this.#ipcWrapper, this.#sharedUdpSocketHandlers, options);
        if (callback)
            socket.on('message', callback);
        return socket;
    }
}
exports.InstanceBase = InstanceBase;
//# sourceMappingURL=base.js.map