import EventEmitter from 'eventemitter3';
import { TCPHelperEvents, TCPHelperOptions } from './tcp.js';
export interface TelnetHelperEvents extends TCPHelperEvents {
    sb: [Buffer];
    iac: [string, number];
}
export type TelnetHelperOptions = TCPHelperOptions;
export declare class TelnetHelper extends EventEmitter<TelnetHelperEvents> {
    #private;
    get isConnected(): boolean;
    get isConnecting(): boolean;
    get isDestroyed(): boolean;
    constructor(host: string, port: number, options?: TelnetHelperOptions);
    connect(): boolean;
    send(message: string | Buffer): Promise<boolean>;
    destroy(): void;
}
//# sourceMappingURL=telnet.d.ts.map