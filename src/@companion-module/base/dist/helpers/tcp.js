"use strict";
/*
 * This file is part of the Companion project
 * Copyright (c) 2018 Bitfocus AS
 * Authors: William Viker <william@bitfocus.io>, Håkon Nessjøen <haakon@bitfocus.io>
 *
 * This program is free software.
 * You should have received a copy of the MIT licence as well as the Bitfocus
 * Individual Contributor License Agreement for companion along with
 * this program.
 *
 * You can be released from the requirements of the license by purchasing
 * a commercial license. Buying such a license is mandatory as soon as you
 * develop commercial activities involving the Companion software without
 * disclosing the source code of your own applications.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TCPHelper = void 0;
const tslib_1 = require("tslib");
const net_1 = tslib_1.__importDefault(require("net"));
const eventemitter3_1 = require("eventemitter3");
const enums_js_1 = require("../module-api/enums.js");
class TCPHelper extends eventemitter3_1.EventEmitter {
    #host;
    #port;
    _socket;
    #options;
    #connected = false;
    #connecting = false;
    #destroyed = false;
    #lastStatus;
    #reconnectTimer;
    #missingErrorHandlerTimer;
    get isConnected() {
        return this.#connected;
    }
    get isConnecting() {
        return this.#connecting;
    }
    get isDestroyed() {
        return this.#destroyed;
    }
    constructor(host, port, options) {
        super();
        this.#host = host;
        this.#port = port;
        this.#options = {
            reconnect_interval: 2000,
            reconnect: true,
            ...options,
        };
        this._socket = new net_1.default.Socket();
        this._socket.setKeepAlive(true);
        this._socket.setNoDelay(true);
        this._socket.on('error', (err) => {
            this.#connecting = false;
            this.#connected = false;
            if (this.#options.reconnect) {
                this.#queueReconnect();
            }
            this.#new_status(enums_js_1.InstanceStatus.UnknownError, err.message);
            this.emit('error', err);
        });
        this._socket.on('ready', () => {
            this.#connected = true;
            this.#connecting = false;
            this.#new_status(enums_js_1.InstanceStatus.Ok);
            this.emit('connect');
        });
        this._socket.on('end', () => {
            this.#connected = false;
            this.#new_status(enums_js_1.InstanceStatus.Disconnected);
            if (!this.#connecting && this.#options.reconnect) {
                this.#queueReconnect();
            }
            this.emit('end');
        });
        this._socket.on('data', (data) => this.emit('data', data));
        this._socket.on('drain', () => this.emit('drain'));
        // Let caller install event handlers first
        setImmediate(() => {
            if (!this.#destroyed)
                this.connect();
        });
        this.#missingErrorHandlerTimer = setTimeout(() => {
            this.#missingErrorHandlerTimer = undefined;
            if (!this.#destroyed && !this.listenerCount('error')) {
                // The socket is active and has no listeners. Log an error for the module devs!
                console.error(`Danger: TCP client for ${this.#host}:${this.#port} is missing an error handler!`);
            }
        }, 5000);
    }
    connect() {
        if (this.#destroyed)
            throw new Error('Cannot connect destroyed socket');
        if (this.#connecting)
            return false;
        this.#connecting = true;
        this._socket.connect(this.#port, this.#host);
        return true;
    }
    async send(message) {
        if (this.#destroyed || this._socket.destroyed)
            throw new Error('Cannot write to destroyed socket');
        if (!message || !message.length)
            throw new Error('No message to send');
        if (!this.#connected) {
            return false;
        }
        try {
            return new Promise((resolve, reject) => {
                this._socket.write(message, (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(true);
                });
            });
        }
        catch (error) {
            this.#connected = false;
            const error2 = error instanceof Error ? error : new Error(`${error}`);
            // Unhandeled socket error
            this.#new_status(enums_js_1.InstanceStatus.UnknownError, error2.message);
            this.emit('error', error2);
            throw error2;
        }
    }
    destroy() {
        this.#destroyed = true;
        if (this.#reconnectTimer !== undefined) {
            clearTimeout(this.#reconnectTimer);
            this.#reconnectTimer = undefined;
        }
        if (this.#missingErrorHandlerTimer !== undefined) {
            clearTimeout(this.#missingErrorHandlerTimer);
            this.#missingErrorHandlerTimer = undefined;
        }
        this._socket.removeAllListeners();
        this.removeAllListeners();
        this._socket.destroy();
    }
    #queueReconnect() {
        if (this.#reconnectTimer !== undefined) {
            clearTimeout(this.#reconnectTimer);
        }
        this.#reconnectTimer = setTimeout(() => {
            this.#reconnectTimer = undefined;
            this.#new_status(enums_js_1.InstanceStatus.Connecting);
            this.connect();
        }, this.#options.reconnect_interval);
    }
    // Private function
    #new_status(status, message) {
        if (this.#lastStatus != status) {
            this.#lastStatus = status;
            this.emit('status_change', status, message);
        }
    }
}
exports.TCPHelper = TCPHelper;
//# sourceMappingURL=tcp.js.map