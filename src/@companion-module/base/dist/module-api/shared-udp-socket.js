"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedUdpSocketImpl = void 0;
const tslib_1 = require("tslib");
const eventemitter3_1 = tslib_1.__importDefault(require("eventemitter3"));
const util_js_1 = require("../util.js");
class SharedUdpSocketImpl extends eventemitter3_1.default {
    #ipcWrapper;
    #moduleUdpSockets;
    #options;
    get handleId() {
        return this.boundState?.handleId;
    }
    get portNumber() {
        return this.boundState?.portNumber;
    }
    get boundState() {
        if (this.#state && typeof this.#state === 'object') {
            return this.#state;
        }
        else {
            return undefined;
        }
    }
    #state = 'pending';
    constructor(ipcWrapper, moduleUdpSockets, options) {
        super();
        this.#ipcWrapper = ipcWrapper;
        this.#moduleUdpSockets = moduleUdpSockets;
        this.#options = { ...options };
    }
    bind(port, _address, callback) {
        if (this.#state && typeof this.#state === 'object')
            throw new Error('Socket is already bound');
        switch (this.#state) {
            case 'fatalError':
                throw new Error('Socket has encountered fatal error');
            case 'binding':
                throw new Error('Socket is already bound');
            case 'closed':
                throw new Error('Socket is closing');
            case 'pending':
                break;
            default:
                (0, util_js_1.assertNever)(this.#state);
                throw new Error('Invalid socket state');
        }
        this.#state = 'binding';
        if (callback)
            this.on('listening', callback);
        this.#ipcWrapper
            .sendWithCb('sharedUdpSocketJoin', {
            family: this.#options.type,
            portNumber: port,
            // Future: use address?
        })
            .then((handleId) => {
            this.#state = { portNumber: port, handleId };
            this.#moduleUdpSockets.set(handleId, this);
            this.emit('listening');
        }, (err) => {
            this.#state = 'closed';
            this.emit('error', err instanceof Error ? err : new Error(err));
        })
            .catch(() => null); // Make sure any errors in user code don't cause a crash
    }
    close(callback) {
        if (this.#state && typeof this.#state === 'object') {
            // OK
        }
        else {
            switch (this.#state) {
                case 'fatalError':
                    throw new Error('Socket has encountered fatal error');
                case 'pending':
                case 'closed':
                case 'binding':
                    throw new Error('Socket is not open');
                default:
                    (0, util_js_1.assertNever)(this.#state);
                    throw new Error('Invalid socket state');
            }
        }
        const handleId = this.#state.handleId;
        this.#state = 'closed';
        if (callback)
            this.on('close', callback);
        this.#ipcWrapper
            .sendWithCb('sharedUdpSocketLeave', {
            handleId: handleId,
        })
            .then(() => {
            this.#moduleUdpSockets.delete(handleId);
            this.emit('close');
        }, (err) => {
            this.#moduleUdpSockets.delete(handleId);
            this.emit('error', err instanceof Error ? err : new Error(err));
        })
            .catch(() => null); // Make sure any errors in user code don't cause a crash
    }
    send(bufferOrList, offsetOrPort, lengthOrAddress, portOrCallback, address, callback) {
        if (typeof offsetOrPort !== 'number')
            throw new Error('Invalid arguments');
        if (typeof lengthOrAddress === 'number') {
            if (typeof portOrCallback !== 'number' || typeof address !== 'string')
                throw new Error('Invalid arguments');
            if (callback !== undefined && typeof callback !== 'number')
                throw new Error('Invalid arguments');
            const buffer = this.#processBuffer(bufferOrList, offsetOrPort, lengthOrAddress);
            this.#sendInner(buffer, portOrCallback, address, callback);
        }
        else if (typeof lengthOrAddress === 'string') {
            if (portOrCallback !== undefined && typeof portOrCallback !== 'function')
                throw new Error('Invalid arguments');
            const buffer = this.#processBuffer(bufferOrList, 0, undefined);
            this.#sendInner(buffer, offsetOrPort, lengthOrAddress, portOrCallback);
        }
        else {
            throw new Error('Invalid arguments');
        }
    }
    #processBuffer(bufferOrList, offset, length) {
        let buffer;
        if (typeof bufferOrList === 'string') {
            buffer = Buffer.from(bufferOrList, 'utf-8');
        }
        else if (Buffer.isBuffer(bufferOrList)) {
            buffer = bufferOrList;
        }
        else if (Array.isArray(bufferOrList)) {
            // Don't apply length checks
            return Buffer.from(bufferOrList);
        }
        else {
            buffer = Buffer.from(bufferOrList.buffer, bufferOrList.byteOffset, bufferOrList.byteLength);
        }
        return buffer.subarray(offset, length !== undefined ? length + offset : undefined);
    }
    #sendInner(buffer, port, address, callback) {
        if (!this.#state || typeof this.#state !== 'object')
            throw new Error('Socket is not open');
        this.#ipcWrapper
            .sendWithCb('sharedUdpSocketSend', {
            handleId: this.#state.handleId,
            message: buffer,
            address: address,
            port: port,
        })
            .then(() => {
            callback?.();
        }, (err) => {
            this.emit('error', err instanceof Error ? err : new Error(err));
        })
            .catch(() => null); // Make sure any errors in user code don't cause a crash
    }
    receiveSocketMessage(message) {
        try {
            this.emit('message', message.message, message.source);
        }
        catch (_e) {
            // Ignore
        }
    }
    receiveSocketError(error) {
        this.#state = 'fatalError';
        const boundState = this.boundState;
        if (boundState)
            this.#moduleUdpSockets.delete(boundState.handleId);
        try {
            this.emit('error', error);
        }
        catch (_e) {
            // Ignore
        }
    }
}
exports.SharedUdpSocketImpl = SharedUdpSocketImpl;
//# sourceMappingURL=shared-udp-socket.js.map