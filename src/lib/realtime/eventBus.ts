import { EventEmitter } from "events";

type EventCallback = (data: any) => void;

class RealtimeEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(200);
  }

  emit(channel: string, event: string, payload: any) {
    this.emitter.emit(`${channel}:${event}`, payload);
    // Also emit wildcard for user
    this.emitter.emit(channel, { event, ...payload });
  }

  subscribe(channel: string, callback: EventCallback): () => void {
    this.emitter.on(channel, callback);
    return () => {
      this.emitter.off(channel, callback);
    };
  }
}

declare global {
  var sinoRealtimeBus: RealtimeEventBus | undefined;
}

export const realtimeBus = globalThis.sinoRealtimeBus ?? new RealtimeEventBus();

if (process.env.NODE_ENV !== "production") {
  globalThis.sinoRealtimeBus = realtimeBus;
}