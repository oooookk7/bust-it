import { SocketOutEventEnum } from '../globals/enums';

export const startAction = (dispatch: any, socket: any) => {
    socket.emit(SocketOutEventEnum.START, {});
};