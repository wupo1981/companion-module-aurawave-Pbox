import type { CompanionActionDefinitions, CompanionRecordedAction } from './action.js';
import type { CompanionFeedbackDefinitions } from './feedback.js';
import type { CompanionPresetDefinitions } from './preset.js';
import type { InstanceStatus, LogLevel } from './enums.js';
import type { ActionInstance, FeedbackInstance } from '../host-api/api.js';
import type { InstanceBaseShared } from '../instance-base.js';
import type { CompanionVariableDefinition, CompanionVariableValue, CompanionVariableValues } from './variable.js';
import type { OSCSomeArguments } from '../common/osc.js';
import type { SomeCompanionConfigField } from './config.js';
import type { CompanionHTTPRequest, CompanionHTTPResponse } from './http.js';
import { SharedUdpSocket, SharedUdpSocketMessageCallback, SharedUdpSocketOptions } from './shared-udp-socket.js';
export interface InstanceBaseOptions {
    /**
     * Disable enforcement of variables requiring a definition.
     * It is not recommended to set this, unless you know what you are doing.
     */
    disableVariableValidation: boolean;
}
export declare abstract class InstanceBase<TConfig> implements InstanceBaseShared<TConfig> {
    #private;
    readonly id: string;
    get instanceOptions(): InstanceBaseOptions;
    /**
     * The user chosen name for this instance.
     * This can be changed just before `configUpdated` is called
     */
    get label(): string;
    /**
     * Create an instance of the module
     */
    constructor(internal: unknown);
    private _handleInit;
    private _handleDestroy;
    private _handleConfigUpdateAndLabel;
    private _handleExecuteAction;
    private _handleUpdateFeedbacks;
    private _handleUpdateActions;
    private _handleGetConfigFields;
    private _handleHttpRequest;
    private _handleLearnAction;
    private _handleLearnFeedback;
    private _handleStartStopRecordActions;
    private _handleVariablesChanged;
    private _handleSharedUdpSocketMessage;
    private _handleSharedUdpSocketError;
    /**
     * Main initialization function called
     * once the module is OK to start doing things.
     */
    abstract init(config: TConfig, isFirstInit: boolean): Promise<void>;
    /**
     * Clean up the instance before it is destroyed.
     */
    abstract destroy(): Promise<void>;
    /**
     * Called when the configuration is updated.
     * @param config The new config object
     */
    abstract configUpdated(config: TConfig): Promise<void>;
    /**
     * Save an updated configuration object
     * @param newConfig The new config object
     */
    saveConfig(newConfig: TConfig): void;
    /**
     * Creates the configuration fields for web config
     */
    abstract getConfigFields(): SomeCompanionConfigField[];
    /**
     * Handle HTTP requests from Companion
     * @param request partial request object from Express
     */
    handleHttpRequest?(request: CompanionHTTPRequest): CompanionHTTPResponse | Promise<CompanionHTTPResponse>;
    /**
     * Handle request from Companion to start/stop recording actions
     * @param isRecording whether recording is now running
     */
    handleStartStopRecordActions?(isRecording: boolean): void;
    /**
     * Set the action definitions for this instance
     * @param actions The action definitions
     */
    setActionDefinitions(actions: CompanionActionDefinitions): void;
    /**
     * Set the feedback definitions for this instance
     * @param feedbacks The feedback definitions
     */
    setFeedbackDefinitions(feedbacks: CompanionFeedbackDefinitions): void;
    /**
     * Set the peset definitions for this instance
     * @param presets The preset definitions
     */
    setPresetDefinitions(presets: CompanionPresetDefinitions): void;
    /**
     * Set the variable definitions for this instance
     * @param variables The variable definitions
     */
    setVariableDefinitions(variables: CompanionVariableDefinition[]): void;
    /**
     * Set the values of some variables
     * @param values The new values for the variables
     */
    setVariableValues(values: CompanionVariableValues): void;
    /**
     * Get the last set value of a variable from this connection
     * @param variableId id of the variable
     * @returns The value
     */
    getVariableValue(variableId: string): CompanionVariableValue | undefined;
    /**
     * Parse and replace all the variables in a string
     * Note: You must not use this for feedbacks, as your feedback will not update when the variable changes.
     * There is an alternate version of this supplied to each of the action/feedback callbacks that tracks
     * usages properly and will retrigger the feedback when the variables change.
     * @param text The text to parse
     * @returns The string with variables replaced with their values
     */
    parseVariablesInString(text: string): Promise<string>;
    /**
     * Request all feedbacks of the specified types to be checked for changes
     * @param feedbackTypes The feedback types to check
     */
    checkFeedbacks(...feedbackTypes: string[]): void;
    /**
     * Request the specified feedback instances to be checked for changes
     * @param feedbackIds The ids of the feedback instances to check
     */
    checkFeedbacksById(...feedbackIds: string[]): void;
    /** @deprecated */
    _getAllActions(): Pick<ActionInstance, 'id' | 'actionId' | 'controlId' | 'options'>[];
    /**
     * Call subscribe on all currently known placed actions.
     * It can be useful to trigger this upon establishing a connection, to ensure all data is loaded.
     * @param actionIds The actionIds to call subscribe for. If no values are provided, then all are called.
     */
    subscribeActions(...actionIds: string[]): void;
    /**
     * Call unsubscribe on all currently known placed actions.
     * It can be useful to do some cleanup upon a connection closing.
     * @param actionIds The actionIds to call subscribe for. If no values are provided, then all are called.
     */
    unsubscribeActions(...actionIds: string[]): void;
    /** @deprecated */
    _getAllFeedbacks(): Pick<FeedbackInstance, 'id' | 'feedbackId' | 'controlId' | 'options'>[];
    /**
     * Call subscribe on all currently known placed feedbacks.
     * It can be useful to trigger this upon establishing a connection, to ensure all data is loaded.
     * @param feedbackIds The feedbackIds to call subscribe for. If no values are provided, then all are called.
     */
    subscribeFeedbacks(...feedbackIds: string[]): void;
    /**
     * Call unsubscribe on all currently known placed feedbacks.
     * It can be useful to do some cleanup upon a connection closing.
     * @param feedbackIds The feedbackIds to call subscribe for. If no values are provided, then all are called.
     */
    unsubscribeFeedbacks(...feedbackIds: string[]): void;
    /**
     * Add an action to the current recording session
     * @param action The action to be added to the recording session
     * @param uniquenessId A unique id for the action being recorded. This should be different for each action, but by passing the same as a previous call will replace the previous value.
     */
    recordAction(action: CompanionRecordedAction, uniquenessId?: string): void;
    /**
     * @deprecated Experimental: This method may change without notice. Do not use!
     * Set the value of a custom variable
     * @param variableName
     * @param value
     * @returns Promise which resolves upon success, or rejects if the variable no longer exists
     */
    setCustomVariableValue(variableName: string, value: CompanionVariableValue): void;
    /**
     * Send an osc message from the system osc sender
     * @param host destination ip address
     * @param port destination port number
     * @param path message path
     * @param args mesage arguments
     */
    oscSend(host: string, port: number, path: string, args: OSCSomeArguments): void;
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
    updateStatus(status: InstanceStatus, message?: string | null): void;
    /**
     * Write a line to the log
     * @param level The level of the message
     * @param message The message text to write
     */
    log(level: LogLevel, message: string): void;
    /**
     * Create a shared udp socket.
     * This can be neccessary for modules where the device/software sends UDP messages to a hardcoded port number. In those
     * cases if you don't use this then it won't be possible to use multiple instances of you module.
     * The api here is a subset of the `Socket` from the builtin `node:dgram`, but with Companion hosting the sockets instead of the module.
     * @param type Type of udp to use
     * @param callback Message received callback
     */
    createSharedUdpSocket(type: 'udp4' | 'udp6', callback?: SharedUdpSocketMessageCallback): SharedUdpSocket;
    createSharedUdpSocket(options: SharedUdpSocketOptions, callback?: SharedUdpSocketMessageCallback): SharedUdpSocket;
}
//# sourceMappingURL=base.d.ts.map