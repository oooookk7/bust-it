import { PlayersInfo, ReducerPayload, PlayerInfo } from '../globals/types';
import { INIT_PLAYERS_STATE } from '../globals/constants';
import { SocketInEventEnum } from '../globals/enums';


export const playersReducer = (state: PlayersInfo = INIT_PLAYERS_STATE, payload: ReducerPayload): PlayersInfo => {
    if (payload.type === SocketInEventEnum.DISCONNECT) {
        Object.keys(state).forEach((playerNo: string) => {
            state[playerNo].active = false;
        });
    }

    else if (!payload.type.toLowerCase().endsWith('error') && payload.info) {
        state = {};

        // Update every player info.
        Object.values(payload.info.players).forEach((player) => {
            let playerNo: string = player.player_no;
            let playerInfo: PlayerInfo = {
                id: player.player_id,
                no: player.player_no,
                active: player.active,
                winner: player.winner || false,
                chips: player.chips,
                turn: payload.info?.player_turn_id === player.player_id,
                cards: []
            }

            if (player.cards) {
                player.cards.forEach((cardValue: string) => {
                    playerInfo.cards.push({ show: true, value: cardValue });
                });
            }
            else {
                for (let i = 0; i < player.cards_count; i++) {
                    playerInfo.cards.push({ show: false });
                }
            }

            state[playerNo] = playerInfo;
        });
    }

    return { ...state };
};