import { SocketInEventEnum, SocketOutEventEnum, GameStateEnum, GameErrorTypeEnum } from './globals/enums';
import { ErrorInfo, GameStatusInfo } from './globals/types';
import { logger } from './utils';

export class Socket {

    private socket: any;
    public id: string;

    constructor(socket: any) {
        this.socket = socket;
        this.id = socket.id;
    }

    public room(): string {
        let self = this;
        let roomName = '';
        self.socket.rooms.forEach((_roomName: string) => {
            if (_roomName !== self.id) roomName = _roomName;
        });
        return roomName;
    }

    public on(eventName: SocketInEventEnum, fn: any) {
        let self = this;
        self.socket.on(eventName, (payload: any) => {
            logger.debug(`Incoming [${eventName}|${self.room()}](${self.id}): Received from player →`, payload);
            fn(payload);
        });
    }

    public broadcast(eventName: SocketOutEventEnum, payload: GameStatusInfo | ErrorInfo) {
        let self = this;
        let roomName: string = self.room() || (payload as any).game_id;

        if (!([
            SocketOutEventEnum.RESULT,
            SocketOutEventEnum.ENDED,
            SocketOutEventEnum.PLAYER_JOINED,
            SocketOutEventEnum.PLAYER_LEFT,
            SocketOutEventEnum.ERROR

        ].indexOf(eventName) > -1)) {
            throw new Error(`Broadcast is not valid for event "${eventName}"`);
        }

        else if (!roomName) {
            throw new Error(`Unable to broadcast as room is not found`)
        }

        self.socket.to(roomName).emit(eventName, payload);
        if (!self.socket.disconnected) self.socket.emit(eventName, payload);
        logger.debug(`Broadcasted [${eventName}|${self.room()}](${self.id}): Sent to all players →`, (payload as any).type ? payload : null);
    }

    public broadcastP2P(eventName: SocketOutEventEnum, payload: GameStatusInfo) {
        let self = this;

        if (!([
            SocketOutEventEnum.STARTED,
            SocketOutEventEnum.PLAYER_TURN,
            SocketOutEventEnum.SHUFFLED,
            SocketOutEventEnum.DRAWN

        ].indexOf(eventName) > -1 || (eventName === SocketOutEventEnum.PLAYER_LEFT && payload.state === GameStateEnum.STARTED))) {
            throw new Error(`Broadcast P2P is not valid for event "${eventName}" or state "${payload.state}"`);
        }

        // Emit information privately so each users can see their own info only.
        let activePlayerIds: Array<string> = Object.values(payload.players_no);

        activePlayerIds.forEach((playerId: string) => {
            // TODO: Is there a better strategy? This sounds costly.
            let copyGameInfo: GameStatusInfo = JSON.parse(JSON.stringify(payload));

            Object.keys(payload.players).forEach((_playerId: string) => {
                if (_playerId !== playerId) delete copyGameInfo.players[_playerId].cards;
            });

            delete copyGameInfo.deck;

            if (playerId === self.id) {
                if (!self.socket.disconnected) {
                    self.socket.emit(eventName, copyGameInfo);
                    logger.debug(`Broadcast P2P [${eventName}|${self.room()}](${self.id}): Sent to player →`);
                }
            }
            else {
                self.socket.to(playerId).emit(eventName, copyGameInfo);
                logger.debug(`Broadcast P2P [${eventName}|${self.room()}](${self.id}::${playerId}): Sent to other player →`);
            }
        });
    }

    public send(eventName: SocketOutEventEnum, payload: GameStatusInfo | ErrorInfo) {
        let self = this;

        if (self.socket.disconnected) return;

        if (!([
            SocketOutEventEnum.JOINED,
            SocketOutEventEnum.READIED,
            SocketOutEventEnum.JOIN_ERROR,
            SocketOutEventEnum.READY_ERROR,
            SocketOutEventEnum.START_ERROR
        ].indexOf(eventName) > -1 || (eventName === SocketOutEventEnum.ERROR && (payload as any).type === GameErrorTypeEnum.GAME_INVALID_STATE))) {
            throw new Error(`Broadcast P2P is not valid for event "${eventName}" or state "${(payload as any).state || ''}"`);
        }

        self.socket.emit(eventName, payload);
        logger.debug(`Send P2P [${eventName}|${self.room()}](${self.id}): Sent to player →`, (payload as any).type ? payload : null);
    }

    public join(roomName: string) {
        let self = this;

        if (self.room() !== roomName && !self.socket.disconnected) {
            logger.debug(`Connect [${SocketInEventEnum.JOIN}|${roomName}]: Server joining room`);
            self.socket.join(roomName);
        }
    }

    public disconnect() {
        let self = this;

        if (self.socket && !self.socket.disconnected) {
            logger.debug(`Disconnect [${SocketInEventEnum.DISCONNECT}|${self.room()}]: Server disconnecting`);
            self.socket.disconnect();
        }
    }
}