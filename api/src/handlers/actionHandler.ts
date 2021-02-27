import { GameStateEnum, ActionTypeEnum, SocketInEventEnum, GameErrorTypeEnum, SocketOutEventEnum } from '../globals/enums'
import { SocketActionEventPayload, GameStatusInfo, ErrorInfo } from '../globals/types';
import { Sessions } from '../sessions';
import { Socket } from '../socket';
import { actionHelper } from '../helpers/actionHelper';
import { logger } from '../utils';


export const actionHandler = (socket: Socket, sessions: Sessions) => {

    const onErrorFn = (gameId: string, errorInfo: ErrorInfo) => {
        if (errorInfo.type === GameErrorTypeEnum.GAME_INVALID_STATE) {
            return socket.send(SocketOutEventEnum.ERROR, errorInfo);
        }

        socket.broadcast(SocketOutEventEnum.ERROR, errorInfo);
    };

    const onActionEvent = (payload: SocketActionEventPayload) => {
        switch (payload.type) {
            case ActionTypeEnum.SHUFFLE:
            case ActionTypeEnum.DRAW:
                actionHelper(sessions, socket.room(), socket.id, payload.type).then((gameInfo: any | GameStatusInfo) => {
                    socket.broadcastP2P(payload.type === ActionTypeEnum.SHUFFLE ? SocketOutEventEnum.SHUFFLED : SocketOutEventEnum.DRAWN, gameInfo);

                }).catch((errorInfo: ErrorInfo) => {
                    onErrorFn(socket.room(), errorInfo);
                });
                break;

            case ActionTypeEnum.NEXT:
                actionHelper(sessions, socket.room(), socket.id, payload.type).then((gameInfo: any | GameStatusInfo) => {
                    if (gameInfo.state === GameStateEnum.ENDED) {
                        // Game will be auto removed. Players disconnect on their end.
                        socket.broadcast(SocketOutEventEnum.ENDED, gameInfo);
                    }
                    else if (gameInfo.round_result) {
                        socket.broadcast(SocketOutEventEnum.RESULT, gameInfo);
                    }
                    else {
                        socket.broadcastP2P(SocketOutEventEnum.PLAYER_TURN, gameInfo);
                    }

                }).catch((errorInfo: ErrorInfo) => {
                    onErrorFn(socket.room(), errorInfo);
                });
        }
    };

    socket.on(SocketInEventEnum.ACTION, onActionEvent);
};
