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
exports.TelnetHelper = void 0;
const tslib_1 = require("tslib");
const eventemitter3_1 = tslib_1.__importDefault(require("eventemitter3"));
const stream_1 = require("stream");
const tcp_js_1 = require("./tcp.js");
// const NULL = 0
const DATA = 0;
const SE = 240;
const SB = 250;
const WILL = 251;
const WONT = 252;
const DO = 253;
const DONT = 254;
const IAC = 255;
class TelnetHelper extends eventemitter3_1.default {
    #tcp;
    #stream;
    #missingErrorHandlerTimer;
    get isConnected() {
        return this.#tcp.isConnected;
    }
    get isConnecting() {
        return this.#tcp.isConnecting;
    }
    get isDestroyed() {
        return this.#tcp.isDestroyed;
    }
    constructor(host, port, options) {
        super();
        this.#tcp = new tcp_js_1.TCPHelper(host, port, options);
        this.#stream = new TelnetStream();
        this.#tcp._socket.pipe(this.#stream);
        this.#tcp.on('connect', () => this.emit('connect'));
        this.#tcp.on('end', () => this.emit('end'));
        this.#tcp.on('error', (error) => this.emit('error', error));
        this.#tcp.on('status_change', (status, message) => this.emit('status_change', status, message));
        // Ignore drain and data, they go via the stream
        this.#stream.on('iac', (a, b) => this.emit('iac', a, b));
        this.#stream.on('sb', (buffer) => this.emit('sb', buffer));
        this.#stream.on('data', (data) => this.emit('data', data));
        this.#stream.on('drain', () => this.emit('drain'));
        this.#missingErrorHandlerTimer = setTimeout(() => {
            this.#missingErrorHandlerTimer = undefined;
            if (!this.isDestroyed && !this.listenerCount('error')) {
                // The socket is active and has no listeners. Log an error for the module devs!
                console.error(`Danger: Telnet client for ${host}:${port} is missing an error handler!`);
            }
        }, 5000);
    }
    connect() {
        return this.#tcp.connect();
    }
    async send(message) {
        return this.#tcp.send(message);
    }
    destroy() {
        this.#tcp.destroy();
        if (this.#missingErrorHandlerTimer !== undefined) {
            clearTimeout(this.#missingErrorHandlerTimer);
            this.#missingErrorHandlerTimer = undefined;
        }
        this.#stream.removeAllListeners();
        this.#stream.destroy();
    }
}
exports.TelnetHelper = TelnetHelper;
/*
 * TelnetStream
 */
class TelnetStream extends stream_1.Transform {
    #buffer;
    #subbuffer;
    #state;
    constructor(options) {
        super(options);
        this.#buffer = Buffer.alloc(0);
        this.#subbuffer = Buffer.alloc(0);
        this.#state = DATA;
    }
    _transform(obj, _encoding, callback) {
        for (let i = 0; i < obj.length; ++i) {
            this.#handleByte(obj[i]);
        }
        const data = this.#getData();
        if (data.length) {
            this.push(data);
        }
        callback();
    }
    #handleByte(byte) {
        if (this.#state === DATA) {
            if (byte === IAC) {
                this.#state = IAC;
                return;
            }
            this.#buffer = Buffer.concat([this.#buffer, Buffer.from([byte])]);
        }
        else if (this.#state === IAC) {
            switch (byte) {
                case SB:
                case WILL:
                case WONT:
                case DO:
                case DONT:
                    this.#state = byte;
                    break;
                default:
                    this.#state = DATA;
                    break;
            }
        }
        else if (this.#state >= WILL && this.#state <= DONT) {
            let iac = undefined;
            switch (this.#state) {
                case WILL:
                    iac = 'WILL';
                    break;
                case WONT:
                    iac = 'WONT';
                    break;
                case DO:
                    iac = 'DO';
                    break;
                case DONT:
                    iac = 'DONT';
                    break;
                default:
                    // never hit
                    return;
            }
            this.emit('iac', iac, byte);
            this.#state = DATA;
            return;
        }
        else if (this.#state === SB) {
            if (byte === SE) {
                this.emit('sb', this.#subbuffer);
                this.#state = DATA;
                this.#subbuffer = Buffer.alloc(0);
                return;
            }
            this.#subbuffer = Buffer.concat([this.#subbuffer, Buffer.from([byte])]);
        }
    }
    #getData() {
        const buff = this.#buffer;
        this.#buffer = Buffer.alloc(0);
        return buff;
    }
}
//# sourceMappingURL=telnet.js.map