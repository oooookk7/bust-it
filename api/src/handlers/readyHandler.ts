import { GameErrorTypeEnum, SocketInEventEnum, SocketOutEventEnum } from '../globals/enums'
import { GameStatusInfo, ErrorInfo, SocketReadyEventPayload } from '../globals/types';
import { logger } from '../utils';
import { Sessions } from '../sessions';
import { Socket } from '../socket';
import { readyHelper } from '../helpers/readyHelper'


export const readyHandler = (socket: Socket, sessions: Sessions) => {

    const onReadyEvent = (payload: SocketReadyEventPayload) => {
        readyHelper(sessions, socket.room(), socket.id, payload.player_init_chips).then((gameInfo: any | GameStatusInfo) => {
            socket.send(SocketOutEventEnum.READIED, gameInfo);

        }).catch((errorInfo: ErrorInfo) => {
            socket.send(SocketOutEventEnum.READY_ERROR, errorInfo);

            if ([
                GameErrorTypeEnum.GAME_ALREADY_READY,
                GameErrorTypeEnum.SERVER_ERROR
            ].indexOf(errorInfo.type) === -1) {
                socket.disconnect();
            }
        });
    };

    socket.on(SocketInEventEnum.READY, onReadyEvent);
};