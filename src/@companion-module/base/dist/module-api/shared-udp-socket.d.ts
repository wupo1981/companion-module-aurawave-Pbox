import type { RemoteInfo } from 'dgram';
import type { SharedUdpSocketMessage, ModuleToHostEventsV0SharedSocket, HostToModuleEventsV0SharedSocket } from '../host-api/api.js';
import type { IpcWrapper } from '../host-api/ipc-wrapper.js';
import EventEmitter from 'eventemitter3';
export interface SharedUdpSocketEvents {
    error: [err: Error];
    listening: [];
    close: [];
    message: [msg: Buffer, rinfo: RemoteInfo];
}
export interface SharedUdpSocket extends EventEmitter<SharedUdpSocketEvents> {
    /**
     * Bind to the shared socket. Until you call this, the shared socket will be inactive
     * @param port Port number to listen on
     * @param address (Unused) Local address to listen on
     * @param callback Added to the `listening` event. Called once the socket is listening
     */
    bind(port: number, address?: string, callback?: () => void): void;
    /**
     * Close your reference to the shared socket.
     * @param callback Called once the socket has closed
     */
    close(callback?: () => void): void;
    /**
     * Send a message from the shared socket
     * @param bufferOrList Data to send
     * @param port Target port number
     * @param address Target address
     * @param callback Callback to execute once the data has been sent
     */
    send(bufferOrList: Buffer | DataView | string | Array<number>, port: number, address: string, callback?: () => void): void;
    /**
     * Send a message from the shared socket
     * @param bufferOrList Data to send
     * @param offset Offset in the buffer to start sending from
     * @param length Length of the data to send. Limited to the length of the bufer
     * @param port Target port number
     * @param address Target address
     * @param callback Callback to execute once the data has been sent
     */
    send(buffer: Buffer | DataView | string, offset: number, length: number, port: number, address: string, callback?: () => void): void;
}
export interface SharedUdpSocketOptions {
    type: 'udp4' | 'udp6';
}
export type SharedUdpSocketMessageCallback = (message: Buffer, rinfo: RemoteInfo) => void;
export declare class SharedUdpSocketImpl extends EventEmitter<SharedUdpSocketEvents> implements SharedUdpSocket {
    #private;
    get handleId(): string | undefined;
    get portNumber(): number | undefined;
    private get boundState();
    constructor(ipcWrapper: IpcWrapper<ModuleToHostEventsV0SharedSocket, HostToModuleEventsV0SharedSocket>, moduleUdpSockets: Map<string, SharedUdpSocketImpl>, options: SharedUdpSocketOptions);
    bind(port: number, _address?: string, callback?: () => void): void;
    close(callback?: () => void): void;
    send(bufferOrList: string | Buffer | DataView | number[], port: number, address: string, callback?: () => void): void;
    send(buffer: string | Buffer | DataView, offset: number, length: number, port: number, address: string, callback?: () => void): void;
    receiveSocketMessage(message: SharedUdpSocketMessage): void;
    receiveSocketError(error: Error): void;
}
//# sourceMappingURL=shared-udp-socket.d.ts.map