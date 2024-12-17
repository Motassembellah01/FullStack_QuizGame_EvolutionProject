/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/semi, @typescript-eslint/ban-types
type CallbackSignature = (params: any) => {};

export class SocketTestHelper {
    on(event: string, callback: CallbackSignature): void {

        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }

        this.callbacks.get(event)!.push(callback);
        
    }

    // eslint-disable-next-line no-unused-vars
    emit(event: string, ...params: any): void {
        return;
    }

    disconnect(): void {
        return;
    }

    peerSideEmit(event: string, params?: any): void {
        if (!this.callbacks.has(event)) {
            return;
        }

        for (const callback of this.callbacks.get(event)!) {
            callback(params);
        }
    }

    removeListener(event?: string): void {
        if (!event) {
            this.callbacks = new Map<string, CallbackSignature[]>();
            return;
        }
        if (this.callbacks.has(event)) {
            this.callbacks.delete(event);
        }
    }

    private callbacks = new Map<string, CallbackSignature[]>();
}
