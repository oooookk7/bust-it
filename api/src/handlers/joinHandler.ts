import { GameStateEnum, GameErrorTypeEnum, SocketInEventEnum, SocketOutEventEnum } from '../globals/enums'
import { ErrorInfo, SocketJoinEventPayload } from '../globals/types';
import { logger } from '../utils'
import { Sessions } from '../sessions';
import { Socket } from '../socket';
import { joinHelper } from '../helpers/joinHelper'

export const joinHandler = (socket: Socket, sessions: Sessions) => {

    const onJoinEvent = (payload: SocketJoinEventPayload) => {
        let gameId = payload.game_id;

        joinHelper(sessions, gameId, socket.id).then((gameInfo: any) => {
            socket.join(gameId);
            socket.send(SocketOutEventEnum.JOINED, gameInfo);

            if (gameInfo.state == GameStateEnum.READY) {
                socket.broadcast(SocketOutEventEnum.PLAYER_JOINED, gameInfo);
            }

        }).catch((errorInfo: ErrorInfo) => {
            socket.send(SocketOutEventEnum.JOIN_ERROR, errorInfo);

            if (errorInfo.type !== GameErrorTypeEnum.PLAYER_ALREADY_JOINED) {
                socket.disconnect();
            }
        });
    };

    socket.on(SocketInEventEnum.JOIN, onJoinEvent);
};