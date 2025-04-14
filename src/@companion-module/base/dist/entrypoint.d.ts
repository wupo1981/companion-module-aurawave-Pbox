import type { CompanionStaticUpgradeScript } from './module-api/upgrade.js';
import type { InstanceBase } from './module-api/base.js';
export type InstanceConstructor<TConfig> = new (internal: unknown) => InstanceBase<TConfig>;
/**
 * Setup the module for execution
 * This should be called once per-module, to register the class that should be executed
 * @param factory The class for the module
 * @param upgradeScripts Upgrade scripts
 */
export declare function runEntrypoint<TConfig>(factory: InstanceConstructor<TConfig>, upgradeScripts: CompanionStaticUpgradeScript<TConfig>[]): void;
//# sourceMappingURL=entrypoint.d.ts.map