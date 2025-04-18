import net from 'net';
import { EventEmitter } from 'eventemitter3';
import { InstanceStatus } from '../module-api/enums.js';
type TCPStatuses = InstanceStatus.Ok | InstanceStatus.Connecting | InstanceStatus.Disconnected | InstanceStatus.UnknownError;
export interface TCPHelperEvents {
    error: [err: Error];
    data: [msg: Buffer];
    connect: [];
    end: [];
    drain: [];
    status_change: [status: TCPStatuses, message: string | undefined];
}
export interface TCPHelperOptions {
    /** default 2000 */
    reconnect_interval?: number;
    /** default true */
    reconnect?: boolean;
}
export declare class TCPHelper extends EventEmitter<TCPHelperEvents> {
    #private;
    readonly _socket: net.Socket;
    get isConnected(): boolean;
    get isConnecting(): boolean;
    get isDestroyed(): boolean;
    constructor(host: string, port: number, options?: TCPHelperOptions);
    connect(): boolean;
    send(message: string | Buffer): Promise<boolean>;
    destroy(): void;
}
export {};
//# sourceMappingURL=tcp.d.ts.map