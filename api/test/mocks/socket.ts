export class InternalSocket {

    public id: string;
    public rooms: Set<string>;
    public disconnected: boolean;
    private broadcastId: string | null;
    private clientSubscribers: { [eventName: string]: any }
    private serverSubscribers: { [eventName: string]: any }

    constructor(socketId: string) {
        this.id = socketId;
        this.broadcastId = null;
        this.rooms = new Set([this.id]);
        this.clientSubscribers = {};
        this.serverSubscribers = {};
        this.disconnected = false;
    }

    public to(roomName: string) {
        this.broadcastId = roomName;
        return this;
    }

    public on(eventName: string, fn: any) {
        this.serverSubscribers[eventName] = fn;
        return this;
    }

    public emit(eventName: string, payload?: any) {
        if (this.clientSubscribers[eventName]) {
            this.clientSubscribers[eventName](this.broadcastId || this.id, payload || null);
        }
        this.broadcastId = null;
        return this;
    }

    public join(roomName: string) {
        this.rooms.add(roomName);
        return this;
    }

    public disconnect() {
        this.rooms = new Set();
        this.disconnected = true;
        return this;
    }

    public onClient(eventName: string, fn: any) {
        this.clientSubscribers[eventName] = fn;
    }

    public emitServer(eventName: string, payload?: any) {
        if (this.serverSubscribers[eventName]) {
            this.serverSubscribers[eventName](payload || null);
        }
    }
}