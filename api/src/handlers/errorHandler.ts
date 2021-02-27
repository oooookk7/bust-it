import { GameStateEnum, SocketInEventEnum } from '../globals/enums'
import { GameStatusInfo, ErrorInfo } from '../globals/types';
import { Sessions } from '../sessions';
import { Socket } from '../socket';
import { logger } from '../utils';


export const errorHandler = (socket: Socket, sessions: Sessions) => {

    const onErrorEvent = (error: any) => { };

    socket.on(SocketInEventEnum.ERROR, onErrorEvent);
};
