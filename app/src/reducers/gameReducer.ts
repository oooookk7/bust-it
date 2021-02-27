import { GameInfo, ReducerPayload } from '../globals/types';
import { SocketInEventEnum, GameStatusEnum, ReloadEventEnum, GameSessionStateEnum } from '../globals/enums';
import { INIT_GAME_STATE } from '../globals/constants';
import { Socket } from 'socket.io-client';


export const gameReducer = (state: GameInfo = INIT_GAME_STATE, payload: ReducerPayload): GameInfo => {
    state.actions = {};

    switch (payload.type) {
        case SocketInEventEnum.CONNECT:
            state.actions.loading = true;
            state.playerId = payload.playerId;
            state.status = GameStatusEnum.NOT_JOINED;
            break;

        case SocketInEventEnum.DISCONNECT:
            if (state.joined && state.status !== GameStatusEnum.ENDED) {
                state.status = GameStatusEnum.ENDED;
                state.error = {
                    type: SocketInEventEnum.ERROR,
                    msg: 'You are disconnected and out'
                }
            }
            break;

        case SocketInEventEnum.JOIN_ERROR:
        case SocketInEventEnum.ERROR:
        case SocketInEventEnum.READY_ERROR:
        case SocketInEventEnum.START_ERROR:
            if (!state.joined) {
                state.error = {
                    type: payload.type,
                    msg: payload.error?.msg || 'Unknown error'
                }

                if (state.status === GameStatusEnum.NOT_JOINED && payload.type === SocketInEventEnum.ERROR) {
                    state.error.type = SocketInEventEnum.JOIN_ERROR;
                }

                state.status = GameStatusEnum.ERROR;
            }
            break;

        case ReloadEventEnum.RELOAD:
            if (!state.id && payload.gameId) {
                state.id = payload.gameId;
            }
            break;

        case ReloadEventEnum.ERROR:
            state.error = { msg: payload.error?.msg || 'Unknown Error' };
            break;

        case SocketInEventEnum.SHUFFLED:
            state.actions.shuffling = true;
            state.actions.loading = true;

        default:
            delete state.error;
            state.playerNo = payload.info?.players[state.playerId || ''].player_no;

            if (payload.type === SocketInEventEnum.JOINED) {
                state.joined = true;
            }
            else if ([
                SocketInEventEnum.STARTED,
                SocketInEventEnum.PLAYER_TURN
            ].indexOf(payload.type) > -1) {
                state.turnPlayerId = payload.info?.player_turn_id;
            }

            switch (payload.info?.state) {
                case GameSessionStateEnum.INIT:
                    state.status = GameStatusEnum.NOT_READY;
                    break;
                case GameSessionStateEnum.READY:
                    state.status = GameStatusEnum.READY;
                    state.initChips = payload.info.player_init_chips;
                    break;
                case GameSessionStateEnum.STARTED:
                    state.started = true;
                    state.status = payload.info.round_result ? GameStatusEnum.ROUND_RESULT : GameStatusEnum.ROUND_START;
                    state.rounds = payload.info.rounds;
                    break;
                case GameSessionStateEnum.ENDED:
                    state.status = GameStatusEnum.ENDED;
                    break;
            }

    }

    return { ...state }
};