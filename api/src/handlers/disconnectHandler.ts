import { GameStateEnum, SocketInEventEnum, SocketOutEventEnum } from '../globals/enums'
import { GameStatusInfo, ErrorInfo } from '../globals/types';
import { leaveHelper } from '../helpers/leaveHelper'
import { Sessions } from '../sessions';
import { Socket } from '../socket';
import { logger } from '../utils';


export const disconnectHandler = (socket: Socket, sessions: Sessions) => {

    const onDisconnectEvent = () => {
        // Ignore scenario when user is not in any room.
        if (!socket.room()) return;

        leaveHelper(sessions, socket.room(), socket.id).then((gameInfo: any | GameStatusInfo) => {
            if (Object.keys(gameInfo.players_no).length === 0) return;

            else if (Object.keys(gameInfo.players_no).length === 1 && gameInfo.state === GameStateEnum.ENDED) {
                socket.broadcast(SocketOutEventEnum.ENDED, gameInfo);
            }

            else if (gameInfo.state === GameStateEnum.STARTED) {
                socket.broadcastP2P(SocketOutEventEnum.PLAYER_LEFT, gameInfo);
            }

            else {
                socket.broadcast(SocketOutEventEnum.PLAYER_LEFT, gameInfo);
            }

        }).catch((errorInfo: ErrorInfo) => {
            socket.broadcast(SocketOutEventEnum.ERROR, errorInfo);
        });
    };

    socket.on(SocketInEventEnum.DISCONNECT, onDisconnectEvent);
};
