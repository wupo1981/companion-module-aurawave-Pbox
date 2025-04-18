/**
 * All the possible status levels that an instance can use.
 * Note: When adding more, companion needs to be updated to know how they should be displayed
 */
export declare enum InstanceStatus {
    Ok = "ok",
    Connecting = "connecting",
    Disconnected = "disconnected",
    ConnectionFailure = "connection_failure",
    BadConfig = "bad_config",
    UnknownError = "unknown_error",
    UnknownWarning = "unknown_warning",
    AuthenticationFailure = "authentication_failure"
}
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export declare namespace Regex {
    const IP = "/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/";
    const HOSTNAME = "/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/";
    const BOOLEAN = "/^(true|false|0|1)$/i";
    const PORT = "/^([1-9]|[1-8][0-9]|9[0-9]|[1-8][0-9]{2}|9[0-8][0-9]|99[0-9]|[1-8][0-9]{3}|9[0-8][0-9]{2}|99[0-8][0-9]|999[0-9]|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-4])$/";
    const MAC_ADDRESS = "/^(?:[a-fA-F0-9]{2}:){5}([a-fA-F0-9]{2})$/";
    const PERCENT = "/^(100|[0-9]|[0-9][0-9])$/";
    const FLOAT = "/^([0-9]*\\.)?[0-9]+$/";
    const SIGNED_FLOAT = "/^[+-]?([0-9]*\\.)?[0-9]+$/";
    const FLOAT_OR_INT = "/^([0-9]+)(\\.[0-9]+)?$/";
    const NUMBER = "/^\\d+$/";
    const SIGNED_NUMBER = "/^[+-]?\\d+$/";
    const SOMETHING = "/^.+$/";
    const TIMECODE = "/^(0*[0-9]|1[0-9]|2[0-4]):(0*[0-9]|[1-5][0-9]|60):(0*[0-9]|[1-5][0-9]|60):(0*[0-9]|[12][0-9]|30)$/";
}
//# sourceMappingURL=enums.d.ts.map