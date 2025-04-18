"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Regex = exports.InstanceStatus = void 0;
/**
 * All the possible status levels that an instance can use.
 * Note: When adding more, companion needs to be updated to know how they should be displayed
 */
var InstanceStatus;
(function (InstanceStatus) {
    InstanceStatus["Ok"] = "ok";
    InstanceStatus["Connecting"] = "connecting";
    InstanceStatus["Disconnected"] = "disconnected";
    InstanceStatus["ConnectionFailure"] = "connection_failure";
    InstanceStatus["BadConfig"] = "bad_config";
    InstanceStatus["UnknownError"] = "unknown_error";
    InstanceStatus["UnknownWarning"] = "unknown_warning";
    InstanceStatus["AuthenticationFailure"] = "authentication_failure";
})(InstanceStatus || (exports.InstanceStatus = InstanceStatus = {}));
// eslint-disable-next-line @typescript-eslint/no-namespace
var Regex;
(function (Regex) {
    // TODO - are all of these needed?
    Regex.IP = '/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/';
    Regex.HOSTNAME = '/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/';
    Regex.BOOLEAN = '/^(true|false|0|1)$/i';
    Regex.PORT = '/^([1-9]|[1-8][0-9]|9[0-9]|[1-8][0-9]{2}|9[0-8][0-9]|99[0-9]|[1-8][0-9]{3}|9[0-8][0-9]{2}|99[0-8][0-9]|999[0-9]|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-4])$/';
    Regex.MAC_ADDRESS = '/^(?:[a-fA-F0-9]{2}:){5}([a-fA-F0-9]{2})$/';
    Regex.PERCENT = '/^(100|[0-9]|[0-9][0-9])$/';
    Regex.FLOAT = '/^([0-9]*\\.)?[0-9]+$/';
    Regex.SIGNED_FLOAT = '/^[+-]?([0-9]*\\.)?[0-9]+$/';
    Regex.FLOAT_OR_INT = '/^([0-9]+)(\\.[0-9]+)?$/';
    Regex.NUMBER = '/^\\d+$/';
    Regex.SIGNED_NUMBER = '/^[+-]?\\d+$/';
    Regex.SOMETHING = '/^.+$/';
    Regex.TIMECODE = '/^(0*[0-9]|1[0-9]|2[0-4]):(0*[0-9]|[1-5][0-9]|60):(0*[0-9]|[1-5][0-9]|60):(0*[0-9]|[12][0-9]|30)$/';
})(Regex || (exports.Regex = Regex = {}));
//# sourceMappingURL=enums.js.map