import { SocketOutEventEnum } from '../globals/enums';

export const readyAction = (dispatch: any, socket: any, initChips: number) => {
    socket.emit(SocketOutEventEnum.READY, { player_init_chips: initChips });
};