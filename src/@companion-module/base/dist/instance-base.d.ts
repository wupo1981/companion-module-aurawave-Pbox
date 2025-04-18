export interface InstanceBaseShared<TConfig> {
    /**
     * Main initialization function called
     * once the module is OK to start doing things.
     */
    init(config: TConfig, isFirstInit: boolean): void | Promise<void>;
    /**
     * Clean up the instance before it is destroyed.
     */
    destroy(): void | Promise<void>;
}
//# sourceMappingURL=instance-base.d.ts.map