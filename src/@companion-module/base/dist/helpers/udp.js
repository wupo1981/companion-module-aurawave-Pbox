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
exports.UDPHelper = void 0;
const tslib_1 = require("tslib");
const dgram_1 = tslib_1.__importDefault(require("dgram"));
const eventemitter3_1 = require("eventemitter3");
const enums_js_1 = require("../module-api/enums.js");
class UDPHelper extends eventemitter3_1.EventEmitter {
    #host;
    #port;
    #socket;
    #options;
    #destroyed = false;
    #lastStatus;
    #missingErrorHandlerTimer;
    get isDestroyed() {
        return this.#destroyed;
    }
    constructor(host, port, options) {
        super();
        this.#host = host;
        this.#port = port;
        this.#options = { ...options };
        // this.bound = false
        // this.pending_memberships = []
        this.#socket = dgram_1.default.createSocket('udp4');
        try {
            this.#socket.bind(this.#options.bind_port || 0, this.#options.bind_ip);
        }
        catch (_e) {
            throw new Error(`Unable to bind to ip/port: ${this.#options.bind_ip || '0.0.0.0'}:${this.#options.bind_port || 0}`);
        }
        if (this.#options.ttl !== undefined) {
            this.#socket.setTTL(this.#options.ttl);
        }
        if (this.#options.multicast_ttl !== undefined) {
            this.#socket.setMulticastTTL(this.#options.multicast_ttl);
        }
        this.#socket.on('error', (error) => {
            this.#new_status(enums_js_1.InstanceStatus.UnknownError, error.message);
            this.emit('error', error);
        });
        this.#socket.on('listening', () => {
            // this.bound = true
            // if (this.pending_memberships.length) {
            // 	while (this.pending_memberships.length > 0) {
            // 		this.socket.addMembership(member.shift())
            // 	}
            // }
            // Needed to be called after bind() had completed
            if (this.#options.broadcast) {
                this.#socket.setBroadcast(true);
            }
            if (this.#options.multicast_interface) {
                this.#socket.setMulticastInterface(this.#options.multicast_interface);
            }
            this.#new_status(enums_js_1.InstanceStatus.Ok);
            this.emit('listening');
        });
        // Passing on rinfo to emit instead of omitting it
        this.#socket.on('message', (data, rinfo) => this.emit('data', data, rinfo));
        this.#missingErrorHandlerTimer = setTimeout(() => {
            if (!this.#destroyed && !this.listenerCount('error')) {
                // The socket is active and has no listeners. Log an error for the module devs!
                console.error(`Danger: UDP socket for ${this.#host}:${this.#port} is missing an error handler!`);
            }
        }, 5000);
    }
    async send(message) {
        if (this.#destroyed)
            throw new Error('Cannot write to destroyed socket');
        if (!message || !message.length)
            throw new Error('No message to send');
        return new Promise((resolve, reject) => {
            this.#socket.send(message, this.#port, this.#host, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
    // addMembership(member) {
    // 	if (!this.bound) {
    // 		this.pending_memberships.push(member)
    // 	} else {
    // 		this.socket.addMembership(member)
    // 	}
    // }
    destroy() {
        this.#destroyed = true;
        if (this.#missingErrorHandlerTimer !== undefined) {
            clearTimeout(this.#missingErrorHandlerTimer);
            this.#missingErrorHandlerTimer = undefined;
        }
        this.#socket.removeAllListeners();
        this.#socket.close();
        this.removeAllListeners();
    }
    // Private function
    #new_status(status, message) {
        if (this.#lastStatus != status) {
            this.#lastStatus = status;
            this.emit('status_change', status, message);
        }
    }
}
exports.UDPHelper = UDPHelper;
//# sourceMappingURL=udp.js.map