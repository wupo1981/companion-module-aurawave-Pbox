import type { CompanionInputFieldBase, CompanionInputFieldBonjourDevice, CompanionInputFieldCheckbox, CompanionInputFieldColor, CompanionInputFieldDropdown, CompanionInputFieldMultiDropdown, CompanionInputFieldNumber, CompanionInputFieldStaticText, CompanionInputFieldTextInput } from './input.js';
/**
 * A configuration input field
 */
export interface CompanionConfigField extends CompanionInputFieldBase {
    width: number;
}
/**
 * Some configuration input field
 */
export type SomeCompanionConfigField = (CompanionInputFieldStaticText | CompanionInputFieldColor | CompanionInputFieldTextInput | CompanionInputFieldDropdown | CompanionInputFieldMultiDropdown | CompanionInputFieldNumber | CompanionInputFieldCheckbox | CompanionInputFieldBonjourDevice) & CompanionConfigField;
//# sourceMappingURL=config.d.ts.map