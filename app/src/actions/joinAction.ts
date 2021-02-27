import io from 'socket.io-client'
import { ReloadEventEnum, SocketInEventEnum, SocketOutEventEnum } from '../globals/enums';
import { ReducerPayload } from '../globals/types';
import { SHUFFLE_TIMEOUT } from '../globals/constants';


export const joinAction = (dispatch: any, gameId: string) => {
    let socket = io(`${window.location.hostname}:${process.env.SERVER_PORT}`, { transports: ['websocket'] });

    Object.values(SocketInEventEnum).forEach((eventName) => {
        socket.on(eventName, (_payload: any) => {
            console.debug(`Event "${eventName}" emitted ->`, _payload);

            let payload: ReducerPayload = { type: eventName, actions: {} };

            if (eventName.toLowerCase().endsWith('error')) {
                if (payload instanceof Error) payload.error = { type: 'unknown_error', msg: _payload.message };
                else payload.error = _payload;
            }
            else if (eventName === SocketInEventEnum.CONNECT) {
                payload.playerId = socket.id;
                socket.emit(SocketOutEventEnum.JOIN, { game_id: gameId });
            }
            else if (eventName !== SocketInEventEnum.DISCONNECT) {
                payload.info = _payload;

                if (eventName === SocketInEventEnum.ENDED && !socket.disconnected) {
                    socket.disconnect();
                }
                else if (eventName === SocketInEventEnum.SHUFFLED) {
                    setTimeout(() => {
                        dispatch({ type: ReloadEventEnum.RELOAD });
                    }, SHUFFLE_TIMEOUT);
                }
            }

            dispatch(payload);
        });
    });

    return socket;
};