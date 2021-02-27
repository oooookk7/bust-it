import { SocketOutEventEnum, SocketInEventEnum, ActionTypeEnum, ReloadEventEnum } from '../globals/enums';
import { SHUFFLE_TIMEOUT } from '../globals/constants';

export const drawAction = (dispatch: any, socket: any) => {
    socket.emit(SocketOutEventEnum.ACTION, { type: ActionTypeEnum.DRAW });
};

export const shuffleAction = (dispatch: any, socket: any) => {
    socket.emit(SocketOutEventEnum.ACTION, { type: ActionTypeEnum.SHUFFLE });
    setTimeout(() => {
        dispatch({ type: ReloadEventEnum.RELOAD });
    }, SHUFFLE_TIMEOUT);

    dispatch({ type: SocketInEventEnum.SHUFFLED });
};

export const nextAction = (dispatch: any, socket: any) => {
    socket.emit(SocketOutEventEnum.ACTION, { type: ActionTypeEnum.NEXT });
};