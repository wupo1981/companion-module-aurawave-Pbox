import dgram from 'dgram';
import { EventEmitter } from 'eventemitter3';
import { InstanceStatus } from '../module-api/enums.js';
type UDPStatuses = InstanceStatus.Ok | InstanceStatus.UnknownError;
export interface UDPHelperEvents {
    error: [err: Error];
    listening: [];
    data: [msg: Buffer, rinfo: dgram.RemoteInfo];
    status_change: [status: UDPStatuses, message: string | undefined];
}
export interface UDPHelperOptions {
    /** default: 0 */
    bind_port?: number;
    /** default: 0.0.0.0 */
    bind_ip?: string;
    /** default false */
    broadcast?: boolean;
    /** default 64 */
    ttl?: number;
    /** default 1 */
    multicast_ttl?: number;
    /** default undefined */
    multicast_interface?: string;
}
export declare class UDPHelper extends EventEmitter<UDPHelperEvents> {
    #private;
    get isDestroyed(): boolean;
    constructor(host: string, port: number, options?: UDPHelperOptions);
    send(message: string | Buffer): Promise<void>;
    destroy(): void;
}
export {};
//# sourceMappingURL=udp.d.ts.map