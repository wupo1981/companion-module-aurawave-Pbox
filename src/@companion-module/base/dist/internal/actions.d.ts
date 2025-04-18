import type { LogLevel } from '../module-api/enums.js';
import type { ParseVariablesInStringMessage, ParseVariablesInStringResponseMessage, SetActionDefinitionsMessage, ActionInstance, ExecuteActionMessage, LearnActionMessage, LearnActionResponseMessage } from '../host-api/api.js';
import type { CompanionActionDefinitions } from '../module-api/action.js';
export declare class ActionManager {
    #private;
    constructor(parseVariablesInString: (msg: ParseVariablesInStringMessage) => Promise<ParseVariablesInStringResponseMessage>, setActionDefinitions: (msg: SetActionDefinitionsMessage) => void, log: (level: LogLevel, message: string) => void);
    handleExecuteAction(msg: ExecuteActionMessage): Promise<void>;
    handleUpdateActions(actions: {
        [id: string]: ActionInstance | null | undefined;
    }): void;
    handleLearnAction(msg: LearnActionMessage): Promise<LearnActionResponseMessage>;
    setActionDefinitions(actions: CompanionActionDefinitions): void;
    /** @deprecated */
    _getAllActions(): Pick<ActionInstance, 'id' | 'actionId' | 'controlId' | 'options'>[];
    subscribeActions(actionIds: string[]): void;
    unsubscribeActions(actionIds: string[]): void;
}
//# sourceMappingURL=actions.d.ts.map