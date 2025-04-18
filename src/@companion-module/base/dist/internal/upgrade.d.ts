import type { CompanionStaticUpgradeScript } from '../module-api/upgrade.js';
import type { FeedbackInstance, ActionInstance, UpgradedDataResponseMessage } from '../host-api/api.js';
/**
 * Run through the upgrade scripts for the given data
 * Note: this updates the inputs in place, but the result needs to be sent back to companion
 * @param allActions Actions that may need upgrading
 * @param allFeedbacks Feedbacks that may need upgrading
 * @param defaultUpgradeIndex The lastUpgradeIndex of the connection, if known
 * @param upgradeScripts The scripts that may be run
 * @param config The current config of the module
 * @param skipConfigUpgrade Whether to skip upgrading the config
 * @returns The upgraded data that needs persisting
 */
export declare function runThroughUpgradeScripts(allActions: {
    [id: string]: ActionInstance | undefined | null;
}, allFeedbacks: {
    [id: string]: FeedbackInstance | undefined | null;
}, defaultUpgradeIndex: number | null, upgradeScripts: CompanionStaticUpgradeScript<any>[], config: unknown, skipConfigUpgrade: boolean): UpgradedDataResponseMessage & {
    updatedConfig: unknown | undefined;
};
//# sourceMappingURL=upgrade.d.ts.map