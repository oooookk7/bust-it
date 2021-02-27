import { GameErrorTypeEnum, SocketInEventEnum, SocketOutEventEnum } from '../globals/enums'
import { GameStatusInfo, ErrorInfo } from '../globals/types';
import { logger } from '../utils';
import { Sessions } from '../sessions';
import { Socket } from '../socket';
import { startHelper } from '../helpers/startHelper'


export const startHandler = (socket: Socket, sessions: Sessions) => {

    const onStartEvent = () => {
        startHelper(sessions, socket.room(), socket.id).then((gameInfo: any | GameStatusInfo) => {
            socket.broadcastP2P(SocketOutEventEnum.STARTED, gameInfo);

        }).catch((errorInfo: ErrorInfo) => {
            socket.send(SocketOutEventEnum.START_ERROR, errorInfo);

            if ([
                GameErrorTypeEnum.GAME_ALREADY_STARTED,
                GameErrorTypeEnum.GAME_NOT_ENOUGH_PLAYERS,
                GameErrorTypeEnum.SERVER_ERROR
            ].indexOf(errorInfo.type) === -1) {
                socket.disconnect();
            }
        });
    };

    socket.on(SocketInEventEnum.START, onStartEvent);
};
